import ComplianceCheck from '../models/Compliance.js';
import Email from '../models/Email.js';

// @desc    Check email compliance
// @route   POST /api/compliance/check/:type
// @access  Private
export const checkCompliance = async (req, res) => {
  try {
    const { type } = req.params; // 'gdpr', 'can_spam', 'casl', 'ccpa'
    const { emailId, content, jurisdiction = 'global' } = req.body;

    console.log(`🔍 Starting ${type.toUpperCase()} compliance check for email:`, emailId);

    // Get email content if not provided
    let emailContent = content;
    let email;

    if (emailId) {
      email = await Email.findOne({
        _id: emailId,
        userId: req.user._id,
      });

      if (!email) {
        console.error('❌ Email not found for compliance check:', emailId);
        return res.status(404).json({
          success: false,
          message: 'Email not found',
        });
      }
      emailContent = email.htmlBody || email.textBody;
    }

    if (!emailContent) {
      console.error('❌ No content provided for compliance check');
      return res.status(400).json({
        success: false,
        message: 'Email content is required',
      });
    }

    // Perform compliance check based on type
    const checkResult = await performComplianceCheck(type, emailContent, jurisdiction);

    // Create compliance record
    const complianceCheck = await ComplianceCheck.create({
      emailId,
      userId: req.user._id,
      content: emailContent,
      complianceType: type,
      score: checkResult.score,
      violations: checkResult.violations,
      recommendations: checkResult.recommendations,
      complianceStatus: checkResult.score >= 80 ? 'compliant' : checkResult.score >= 60 ? 'warning' : 'non_compliant',
      jurisdiction,
      nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      auditTrail: [{
        action: 'check_performed',
        details: `${type.toUpperCase()} compliance check completed with score ${checkResult.score}`,
        performedBy: req.user._id,
        ipAddress: req.ip,
      }],
    });

    console.log(`✅ ${type.toUpperCase()} compliance check completed. Score: ${checkResult.score}/100`);

    res.json({
      success: true,
      data: {
        score: checkResult.score,
        violations: checkResult.violations,
        recommendations: checkResult.recommendations,
        status: complianceCheck.complianceStatus,
        jurisdiction,
      },
      message: 'Compliance check completed successfully',
    });
  } catch (error) {
    console.error('❌ Compliance check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing compliance check',
      error: error.message,
    });
  }
};

// @desc    Generate privacy policy
// @route   POST /api/compliance/generate-policy
// @access  Private
export const generatePolicy = async (req, res) => {
  try {
    const { type, companyInfo, jurisdiction = 'global' } = req.body;

    console.log('📄 Generating compliance policy:', type);

    const policyContent = await generateCompliancePolicy(type, companyInfo, jurisdiction);

    // Update or create compliance record with generated policy
    let complianceRecord = await ComplianceCheck.findOne({
      userId: req.user._id,
      complianceType: type,
    }).sort({ createdAt: -1 });

    if (!complianceRecord) {
      complianceRecord = new ComplianceCheck({
        userId: req.user._id,
        complianceType: type,
        jurisdiction,
      });
    }

    // Store generated policy
    if (type === 'privacy_policy') {
      complianceRecord.generatedPolicies.privacyPolicy = policyContent;
    } else if (type === 'terms_of_service') {
      complianceRecord.generatedPolicies.termsOfService = policyContent;
    } else if (type === 'cookie_policy') {
      complianceRecord.generatedPolicies.cookiePolicy = policyContent;
    }

    complianceRecord.auditTrail.push({
      action: 'policy_generated',
      details: `${type} generated for ${jurisdiction} jurisdiction`,
      performedBy: req.user._id,
      ipAddress: req.ip,
    });

    await complianceRecord.save();

    console.log('✅ Compliance policy generated successfully');

    res.json({
      success: true,
      data: {
        type,
        content: policyContent,
        jurisdiction,
      },
      message: 'Policy generated successfully',
    });
  } catch (error) {
    console.error('❌ Generate policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating policy',
      error: error.message,
    });
  }
};

// @desc    Record consent
// @route   POST /api/compliance/record-consent
// @access  Private
export const recordConsent = async (req, res) => {
  try {
    const { contactId, consentType, consentGiven, consentMethod, consentExpiry } = req.body;

    console.log('📝 Recording consent for contact:', contactId);

    // Find or create compliance record
    let complianceRecord = await ComplianceCheck.findOne({
      userId: req.user._id,
      'consentRecords.contactId': contactId,
    });

    if (!complianceRecord) {
      complianceRecord = new ComplianceCheck({
        userId: req.user._id,
        complianceType: 'gdpr',
      });
    }

    // Add consent record
    complianceRecord.consentRecords.push({
      contactId,
      consentType,
      consentGiven,
      consentDate: new Date(),
      consentExpiry: consentExpiry ? new Date(consentExpiry) : null,
      consentMethod,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    complianceRecord.auditTrail.push({
      action: 'consent_recorded',
      details: `${consentGiven ? 'Consent given' : 'Consent withdrawn'} for ${consentType}`,
      performedBy: req.user._id,
      ipAddress: req.ip,
    });

    await complianceRecord.save();

    console.log('✅ Consent recorded successfully');

    res.json({
      success: true,
      data: complianceRecord.consentRecords[complianceRecord.consentRecords.length - 1],
      message: 'Consent recorded successfully',
    });
  } catch (error) {
    console.error('❌ Record consent error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording consent',
      error: error.message,
    });
  }
};

// @desc    Get compliance audit log
// @route   GET /api/compliance/audit-log
// @access  Private
export const getAuditLog = async (req, res) => {
  try {
    const { type, limit = 50 } = req.query;

    console.log('📋 Fetching compliance audit log:', { type, limit });

    const query = { userId: req.user._id };
    if (type) {
      query.complianceType = type;
    }

    const auditRecords = await ComplianceCheck.find(query)
      .populate('performedBy', 'name email')
      .select('complianceType auditTrail createdAt')
      .sort({ 'auditTrail.timestamp': -1 })
      .limit(parseInt(limit))
      .exec();

    // Flatten audit trail
    const flattenedAudits = auditRecords.flatMap(record =>
      record.auditTrail.map(audit => ({
        complianceType: record.complianceType,
        ...audit.toObject(),
        recordCreatedAt: record.createdAt,
      }))
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    console.log(`✅ Retrieved ${flattenedAudits.length} audit log entries`);

    res.json({
      success: true,
      data: flattenedAudits.slice(0, limit),
    });
  } catch (error) {
    console.error('❌ Get audit log error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audit log',
      error: error.message,
    });
  }
};

// Helper function to perform compliance checks
const performComplianceCheck = async (type, content, jurisdiction) => {
  console.log(`🔍 Performing ${type} compliance analysis`);

  const results = {
    score: 100,
    violations: [],
    recommendations: [],
  };

  try {
    switch (type) {
      case 'gdpr':
        return await checkGDPRCompliance(content, jurisdiction, results);
      case 'can_spam':
        return await checkCANSPAMCompliance(content, results);
      case 'casl':
        return await checkCASLCompliance(content, results);
      case 'ccpa':
        return await checkCCPACompliance(content, jurisdiction, results);
      default:
        return results;
    }
  } catch (error) {
    console.error('❌ Compliance check error:', error);
    results.score = 0;
    results.violations.push({
      rule: 'general_error',
      severity: 'critical',
      description: 'Unable to perform compliance check',
      suggestion: 'Please try again or contact support',
    });
    return results;
  }
};

// GDPR compliance checker
const checkGDPRCompliance = async (content, jurisdiction, results) => {
  // Check for required elements
  if (!content.toLowerCase().includes('unsubscribe') && !content.toLowerCase().includes('opt-out')) {
    results.violations.push({
      rule: 'missing_unsubscribe',
      severity: 'critical',
      description: 'Missing clear unsubscribe mechanism',
      suggestion: 'Add prominent unsubscribe link visible without scrolling',
      location: 'footer',
    });
    results.score -= 25;
  }

  if (!content.toLowerCase().includes('privacy policy') && !content.toLowerCase().includes('data protection')) {
    results.violations.push({
      rule: 'transparency_lack',
      severity: 'high',
      description: 'Missing reference to privacy policy or data processing',
      suggestion: 'Include link to privacy policy and data processing information',
      location: 'footer',
    });
    results.score -= 20;
  }

  if (!content.toLowerCase().includes('consent') && !content.toLowerCase().includes('opt-in')) {
    results.violations.push({
      rule: 'consent_missing',
      severity: 'high',
      description: 'No clear consent mechanism mentioned',
      suggestion: 'Reference how consent was obtained for marketing communications',
      location: 'footer',
    });
    results.score -= 15;
  }

  // Add recommendations
  results.recommendations.push({
    priority: 'high',
    action: 'add_unsubscribe',
    description: 'Ensure prominent unsubscribe link in email footer',
    implementation: 'Add clearly visible "Unsubscribe" link that works without requiring login',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });

  return results;
};

// CAN-SPAM compliance checker
const checkCANSPAMCompliance = async (content, results) => {
  // Check for required elements
  if (!content.includes('physical') && !content.includes('address')) {
    results.violations.push({
      rule: 'missing_physical_address',
      severity: 'critical',
      description: 'Missing valid physical mailing address',
      suggestion: 'Include complete physical mailing address in email',
      location: 'footer',
    });
    results.score -= 30;
  }

  if (!content.toLowerCase().includes('unsubscribe') || content.toLowerCase().includes('login')) {
    results.violations.push({
      rule: 'missing_unsubscribe',
      severity: 'critical',
      description: 'Unsubscribe link requires login or is not clearly visible',
      suggestion: 'Add one-click unsubscribe link that works without authentication',
      location: 'footer',
    });
    results.score -= 25;
  }

  // Check subject line for deceptive content (simplified)
  const subject = content.match(/Subject: ([^\n]+)/i);
  if (subject && (subject[1].includes('!') || subject[1].includes('$$$'))) {
    results.violations.push({
      rule: 'deceptive_subject',
      severity: 'medium',
      description: 'Subject line may contain deceptive elements',
      suggestion: 'Ensure subject line accurately represents email content',
      location: 'subject',
    });
    results.score -= 10;
  }

  return results;
};

// CASL compliance checker (Canada)
const checkCASLCompliance = async (content, results) => {
  // Check for consent mechanism
  if (!content.toLowerCase().includes('consent') && !content.toLowerCase().includes('opt-in')) {
    results.violations.push({
      rule: 'consent_missing',
      severity: 'critical',
      description: 'No clear consent mechanism for Canadian recipients',
      suggestion: 'Include clear consent information and opt-out process',
      location: 'footer',
    });
    results.score -= 25;
  }

  // Check for unsubscribe mechanism
  if (!content.toLowerCase().includes('unsubscribe')) {
    results.violations.push({
      rule: 'missing_unsubscribe',
      severity: 'critical',
      description: 'Missing unsubscribe mechanism',
      suggestion: 'Add clear unsubscribe link or instructions',
      location: 'footer',
    });
    results.score -= 20;
  }

  return results;
};

// CCPA compliance checker (California)
const checkCCPACompliance = async (content, jurisdiction, results) => {
  if (jurisdiction === 'us' || jurisdiction === 'global') {
    if (!content.toLowerCase().includes('do not sell') && !content.toLowerCase().includes('opt-out')) {
      results.violations.push({
        rule: 'missing_privacy_rights',
        severity: 'high',
        description: 'Missing CCPA-required privacy rights information',
        suggestion: 'Include "Do Not Sell My Personal Information" link',
        location: 'footer',
      });
      results.score -= 20;
    }
  }

  return results;
};

// Helper function to generate compliance policies
const generateCompliancePolicy = async (type, companyInfo, jurisdiction) => {
  try {
    const aiService = (await import('../services/aiService.js')).default;

    const messages = [
      {
        role: 'system',
        content: `You are a legal expert specializing in ${jurisdiction.toUpperCase()} compliance regulations. Generate a comprehensive, legally-sound ${type.replace('_', ' ')} that meets all regulatory requirements.`
      },
      {
        role: 'user',
        content: `Generate a ${type.replace('_', ' ')} for a company with the following information:

Company: ${companyInfo?.name || 'Company Name'}
Industry: ${companyInfo?.industry || 'Technology'}
Location: ${companyInfo?.location || 'United States'}
Website: ${companyInfo?.website || 'www.company.com'}

The policy must comply with ${jurisdiction.toUpperCase()} regulations and include all legally required sections, clauses, and disclaimers. Make it professional, comprehensive, and easy to understand.`
      }
    ];

    const policy = await aiService.callAI(messages, null, 'policy_generation', {
      temperature: 0.3,
      maxTokens: 2000,
    });

    return policy;
  } catch (error) {
    console.error('❌ Policy generation error:', error);
    return `This is a placeholder ${type.replace('_', ' ')}. Please consult with a legal professional to create a comprehensive policy that meets all regulatory requirements for your jurisdiction.`;
  }
};
