import asyncHandler from 'express-async-handler';
import EmailAuthentication from '../models/EmailAuthentication.js';
import dns from 'dns';
import crypto from 'crypto';

// @desc    Setup email authentication for domain
// @route   POST /api/email-auth/setup
// @access  Private
const setupAuthentication = asyncHandler(async (req, res) => {
  const { domain } = req.body;
  const userId = req.user._id;

  // Check if setup already exists
  let auth = await EmailAuthentication.findOne({ user: userId, domain });

  if (!auth) {
    auth = await EmailAuthentication.create({
      user: userId,
      domain,
      status: 'pending'
    });
  }

  // Generate DKIM keys
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  // Generate DKIM selector
  const selector = `selector_${Date.now()}`;

  auth.dkim = {
    selector,
    publicKey,
    privateKey: encryptPrivateKey(privateKey), // Encrypt for storage
    verified: false,
    errors: []
  };

  // Generate recommended records
  auth.spf = {
    record: `v=spf1 include:_spf.google.com ~all`,
    verified: false,
    errors: []
  };

  auth.dmarc = {
    record: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`,
    policy: 'none',
    verified: false,
    errors: []
  };

  // Generate recommendations
  auth.recommendations = generateRecommendations(auth);

  await auth.save();

  res.status(200).json({
    auth,
    instructions: {
      spf: `Add this TXT record to your DNS: ${auth.spf.record}`,
      dkim: `Add this TXT record: ${selector}._domainkey.${domain} IN TXT "v=DKIM1; k=rsa; p=${publicKey.replace(/\n/g, '')}"`,
      dmarc: `Add this TXT record: _dmarc.${domain} IN TXT "${auth.dmarc.record}"`
    }
  });
});

// @desc    Verify authentication setup
// @route   POST /api/email-auth/:id/verify
// @access  Private
const verifyAuthentication = asyncHandler(async (req, res) => {
  const auth = await EmailAuthentication.findById(req.params.id);

  if (!auth) {
    res.status(404);
    throw new Error('Authentication setup not found');
  }

  auth.status = 'verifying';
  await auth.save();

  // Perform verification
  const results = await performVerification(auth);

  auth.verificationResults = {
    spfCheck: results.spf.verified,
    dkimCheck: results.dkim.verified,
    dmarcCheck: results.dmarc.verified,
    overallScore: calculateOverallScore(results),
    lastChecked: new Date()
  };

  auth.status = results.overallScore >= 80 ? 'verified' : 'failed';

  // Update individual records
  auth.spf.verified = results.spf.verified;
  auth.spf.errors = results.spf.errors;
  auth.dkim.verified = results.dkim.verified;
  auth.dkim.errors = results.dkim.errors;
  auth.dmarc.verified = results.dmarc.verified;
  auth.dmarc.errors = results.dmarc.errors;

  // Log verification
  auth.verificationHistory.push({
    timestamp: new Date(),
    type: 'full_verification',
    result: auth.status === 'verified',
    details: `Score: ${auth.verificationResults.overallScore}%`
  });

  await auth.save();

  res.json({
    auth,
    results,
    score: auth.verificationResults.overallScore,
    status: auth.status
  });
});

// @desc    Get authentication setups
// @route   GET /api/email-auth
// @access  Private
const getAuthentications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const auths = await EmailAuthentication.find({ user: userId }).sort({ createdAt: -1 });
  res.json(auths);
});

// @desc    Get authentication details
// @route   GET /api/email-auth/:id
// @access  Private
const getAuthentication = asyncHandler(async (req, res) => {
  const auth = await EmailAuthentication.findById(req.params.id);

  if (!auth) {
    res.status(404);
    throw new Error('Authentication setup not found');
  }

  res.json(auth);
});

// @desc    Update recommendation status
// @route   PUT /api/email-auth/:id/recommendation
// @access  Private
const updateRecommendation = asyncHandler(async (req, res) => {
  const { recommendationIndex, status } = req.body;
  const auth = await EmailAuthentication.findById(req.params.id);

  if (!auth) {
    res.status(404);
    throw new Error('Authentication setup not found');
  }

  if (auth.recommendations[recommendationIndex]) {
    auth.recommendations[recommendationIndex].status = status;
  }

  await auth.save();
  res.json(auth);
});

// Helper functions
const performVerification = async (auth) => {
  const results = {
    spf: { verified: false, errors: [] },
    dkim: { verified: false, errors: [] },
    dmarc: { verified: false, errors: [] }
  };

  try {
    // Verify SPF
    const spfRecords = await resolveTXTRecord(`${auth.domain}`);
    const hasSPF = spfRecords.some(record => record.includes('v=spf1'));
    results.spf.verified = hasSPF;
    if (!hasSPF) {
      results.spf.errors.push('SPF record not found');
    }

    // Verify DKIM
    const dkimRecords = await resolveTXTRecord(`${auth.dkim.selector}._domainkey.${auth.domain}`);
    const hasDKIM = dkimRecords.some(record => record.includes('v=DKIM1'));
    results.dkim.verified = hasDKIM;
    if (!hasDKIM) {
      results.dkim.errors.push('DKIM record not found');
    }

    // Verify DMARC
    const dmarcRecords = await resolveTXTRecord(`_dmarc.${auth.domain}`);
    const hasDMARC = dmarcRecords.some(record => record.includes('v=DMARC1'));
    results.dmarc.verified = hasDMARC;
    if (!hasDMARC) {
      results.dmarc.errors.push('DMARC record not found');
    }

  } catch (error) {
    console.error('DNS verification error:', error);
    results.spf.errors.push('DNS lookup failed');
    results.dkim.errors.push('DNS lookup failed');
    results.dmarc.errors.push('DNS lookup failed');
  }

  return results;
};

const resolveTXTRecord = (domain) => {
  return new Promise((resolve, reject) => {
    dns.resolveTxt(domain, (err, records) => {
      if (err) {
        resolve([]); // Return empty array for missing records
      } else {
        resolve(records.flat());
      }
    });
  });
};

const calculateOverallScore = (results) => {
  let score = 0;
  if (results.spf.verified) score += 40;
  if (results.dkim.verified) score += 40;
  if (results.dmarc.verified) score += 20;
  return score;
};

const generateRecommendations = (auth) => {
  const recommendations = [];

  if (!auth.spf.verified) {
    recommendations.push({
      type: 'spf_missing',
      priority: 'high',
      message: 'SPF record is required for email authentication',
      solution: 'Add the provided SPF record to your DNS settings'
    });
  }

  if (!auth.dkim.verified) {
    recommendations.push({
      type: 'dkim_missing',
      priority: 'high',
      message: 'DKIM signature is missing',
      solution: 'Add the DKIM record to your DNS to enable email signing'
    });
  }

  if (!auth.dmarc.verified) {
    recommendations.push({
      type: 'dmarc_missing',
      priority: 'medium',
      message: 'DMARC policy not configured',
      solution: 'Add DMARC record to protect against email spoofing'
    });
  }

  if (auth.dmarc.policy === 'none') {
    recommendations.push({
      type: 'dmarc_weak',
      priority: 'medium',
      message: 'DMARC policy is set to monitoring only',
      solution: 'Consider setting DMARC policy to "quarantine" or "reject"'
    });
  }

  return recommendations;
};

const encryptPrivateKey = (privateKey) => {
  // In production, use proper encryption with a key from environment
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
};

export {
  setupAuthentication,
  verifyAuthentication,
  getAuthentications,
  getAuthentication,
  updateRecommendation
};
