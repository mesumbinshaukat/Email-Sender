// express-async-handler removed - using native async/await
import WhiteLabel from '../models/WhiteLabel.js';

// @desc    Get white label settings
// @route   GET /api/white-label
// @access  Private
const getWhiteLabelSettings = async (req, res) => { try {
  const userId = req.user._id;

  let whiteLabel = await WhiteLabel.findOne({ user: userId });

  if (!whiteLabel) {
    whiteLabel = await WhiteLabel.create({
      user: userId,
      branding: {
        companyName: req.user.name || 'Email Tracker'
      }
    });
  }

  res.json(whiteLabel);
}  } catch (error) { res.status(500).json({ message: 'Server error', error: error.message }); } };

// @desc    Update white label branding
// @route   PUT /api/white-label/branding
// @access  Private
const updateBranding = async (req, res) => { try {
  const { branding } = req.body;
  const userId = req.user._id;

  let whiteLabel = await WhiteLabel.findOne({ user: userId });

  if (!whiteLabel) {
    whiteLabel = await WhiteLabel.create({ user: userId });
  }

  whiteLabel.branding = { ...whiteLabel.branding, ...branding };
  await whiteLabel.save();

  res.json(whiteLabel);
}  } catch (error) { res.status(500).json({ message: 'Server error', error: error.message }); } };

// @desc    Update domain settings
// @route   PUT /api/white-label/domain
// @access  Private
const updateDomain = async (req, res) => { try {
  const { domain } = req.body;
  const userId = req.user._id;

  let whiteLabel = await WhiteLabel.findOne({ user: userId });

  if (!whiteLabel) {
    whiteLabel = await WhiteLabel.create({ user: userId });
  }

  whiteLabel.domain = { ...whiteLabel.domain, ...domain };
  await whiteLabel.save();

  res.json(whiteLabel);
}  } catch (error) { res.status(500).json({ message: 'Server error', error: error.message }); } };

// @desc    Update email settings
// @route   PUT /api/white-label/email
// @access  Private
const updateEmailSettings = async (req, res) => { try {
  const { emailSettings } = req.body;
  const userId = req.user._id;

  let whiteLabel = await WhiteLabel.findOne({ user: userId });

  if (!whiteLabel) {
    whiteLabel = await WhiteLabel.create({ user: userId });
  }

  whiteLabel.emailSettings = { ...whiteLabel.emailSettings, ...emailSettings };
  await whiteLabel.save();

  res.json(whiteLabel);
}  } catch (error) { res.status(500).json({ message: 'Server error', error: error.message }); } };

// @desc    Update subscription plan
// @route   PUT /api/white-label/subscription
// @access  Private
const updateSubscription = async (req, res) => { try {
  const { subscription } = req.body;
  const userId = req.user._id;

  let whiteLabel = await WhiteLabel.findOne({ user: userId });

  if (!whiteLabel) {
    whiteLabel = await WhiteLabel.create({ user: userId });
  }

  whiteLabel.subscription = { ...whiteLabel.subscription, ...subscription };
  await whiteLabel.save();

  res.json(whiteLabel);
}  } catch (error) { res.status(500).json({ message: 'Server error', error: error.message }); } };

// @desc    Verify custom domain
// @route   POST /api/white-label/verify-domain
// @access  Private
const verifyDomain = async (req, res) => { try {
  const userId = req.user._id;

  const whiteLabel = await WhiteLabel.findOne({ user: userId });

  if (!whiteLabel || !whiteLabel.domain.customDomain) {
    res.status(400);
    throw new Error('No custom domain configured');
  }

  // In production, this would verify DNS records
  // For now, simulate verification
  const isVerified = Math.random() > 0.3; // 70% success rate for demo

  whiteLabel.domain.isVerified = isVerified;
  if (isVerified) {
    whiteLabel.domain.verificationToken = null;
  }

  await whiteLabel.save();

  res.json({
    verified: isVerified,
    message: isVerified ? 'Domain verified successfully!' : 'Domain verification failed. Please check your DNS records.'
  });
}  } catch (error) { res.status(500).json({ message: 'Server error', error: error.message }); } };

// @desc    Generate custom CSS
// @route   GET /api/white-label/css
// @access  Public (for white-labeled domains)
const getCustomCSS = async (req, res) => { try {
  const domain = req.query.domain;

  if (!domain) {
    res.status(400);
    throw new Error('Domain required');
  }

  const whiteLabel = await WhiteLabel.findOne({
    'domain.customDomain': domain,
    'domain.isVerified': true
  });

  if (!whiteLabel) {
    res.status(404);
    throw new Error('White label configuration not found');
  }

  const css = generateCustomCSS(whiteLabel);
  res.set('Content-Type', 'text/css');
  res.send(css);
}  } catch (error) { res.status(500).json({ message: 'Server error', error: error.message }); } };

// Helper functions
const generateCustomCSS = (whiteLabel) => {
  const { branding } = whiteLabel;

  return `
    :root {
      --primary-color: ${branding.primaryColor};
      --secondary-color: ${branding.secondaryColor};
      --font-family: ${branding.fontFamily}, sans-serif;
    }

    .btn-primary {
      background-color: var(--primary-color);
      border-color: var(--primary-color);
    }

    .btn-primary:hover {
      background-color: var(--primary-color);
      opacity: 0.9;
    }

    .text-primary {
      color: var(--primary-color);
    }

    .bg-primary {
      background-color: var(--primary-color);
    }

    body {
      font-family: var(--font-family);
    }

    ${branding.customCSS || ''}
  `;
};

export {
  getWhiteLabelSettings,
  updateBranding,
  updateDomain,
  updateEmailSettings,
  updateSubscription,
  verifyDomain,
  getCustomCSS
};
