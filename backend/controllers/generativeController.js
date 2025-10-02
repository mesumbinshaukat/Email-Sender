import generativeService from '../services/generativeService.js';

/**
 * @desc    Generate email from bullet points
 * @route   POST /api/ai/generate-email
 * @access  Private
 */
export const generateEmail = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bullets, tone, context } = req.body;

    if (!bullets || !Array.isArray(bullets) || bullets.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Bullet points are required',
      });
    }

    const result = await generativeService.generateEmail(userId, { bullets, tone, context });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Generate email error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate email',
    });
  }
};

/**
 * @desc    Rewrite email in different tone
 * @route   POST /api/ai/rewrite-email
 * @access  Private
 */
export const rewriteEmail = async (req, res) => {
  try {
    const userId = req.user._id;
    const { content, tone, style } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Email content is required',
      });
    }

    const result = await generativeService.rewriteEmail(userId, { content, tone, style });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Rewrite email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rewrite email',
    });
  }
};

/**
 * @desc    Optimize subject line
 * @route   POST /api/ai/optimize-subject
 * @access  Private
 */
export const optimizeSubject = async (req, res) => {
  try {
    const userId = req.user._id;
    const { subject, context, targetAudience } = req.body;

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: 'Subject line is required',
      });
    }

    const result = await generativeService.optimizeSubject(userId, { subject, context, targetAudience });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Optimize subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize subject',
    });
  }
};

/**
 * @desc    Personalize email template
 * @route   POST /api/ai/personalize
 * @access  Private
 */
export const personalizeEmail = async (req, res) => {
  try {
    const userId = req.user._id;
    const { template, recipientData } = req.body;

    if (!template || !recipientData) {
      return res.status(400).json({
        success: false,
        message: 'Template and recipient data are required',
      });
    }

    const result = await generativeService.personalizeEmail(userId, { template, recipientData });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Personalize email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to personalize email',
    });
  }
};

/**
 * @desc    Predict response likelihood
 * @route   POST /api/ai/predict-response
 * @access  Private
 */
export const predictResponse = async (req, res) => {
  try {
    const userId = req.user._id;
    const { subject, body, recipientHistory } = req.body;

    if (!subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Subject and body are required',
      });
    }

    const result = await generativeService.predictResponse(userId, { subject, body, recipientHistory });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Predict response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to predict response',
    });
  }
};

/**
 * @desc    Get best send time for recipient
 * @route   GET /api/ai/best-send-time/:email
 * @access  Private
 */
export const getBestSendTime = async (req, res) => {
  try {
    const userId = req.user._id;
    const { email } = req.params;

    const result = await generativeService.suggestBestSendTime(userId, email);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Best send time error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to determine best send time',
    });
  }
};

/**
 * @desc    Analyze email sentiment
 * @route   POST /api/ai/analyze-sentiment
 * @access  Private
 */
export const analyzeSentiment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
      });
    }

    const result = await generativeService.analyzeSentiment(userId, content);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Analyze sentiment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze sentiment',
    });
  }
};

/**
 * @desc    Generate follow-up sequence
 * @route   POST /api/ai/generate-follow-ups
 * @access  Private
 */
export const generateFollowUps = async (req, res) => {
  try {
    const userId = req.user._id;
    const { originalEmail, goal, numFollowUps } = req.body;

    if (!originalEmail || !goal) {
      return res.status(400).json({
        success: false,
        message: 'Original email and goal are required',
      });
    }

    const result = await generativeService.generateFollowUpSequence(userId, { originalEmail, goal, numFollowUps });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Generate follow-ups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate follow-ups',
    });
  }
};

/**
 * @desc    Summarize email thread
 * @route   POST /api/ai/summarize-thread
 * @access  Private
 */
export const summarizeThread = async (req, res) => {
  try {
    const userId = req.user._id;
    const { emailIds } = req.body;

    if (!emailIds || !Array.isArray(emailIds)) {
      return res.status(400).json({
        success: false,
        message: 'Email IDs array is required',
      });
    }

    // Fetch emails
    const Email = (await import('../models/Email.js')).default;
    const emails = await Email.find({ _id: { $in: emailIds }, userId }).sort({ sentAt: 1 });

    const result = await generativeService.summarizeThread(userId, emails);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Summarize thread error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to summarize thread',
    });
  }
};

/**
 * @desc    Extract action items from email
 * @route   POST /api/ai/extract-actions
 * @access  Private
 */
export const extractActions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
      });
    }

    const result = await generativeService.extractActionItems(userId, content);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Extract actions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extract action items',
    });
  }
};

/**
 * @desc    Suggest relevant attachments
 * @route   POST /api/ai/suggest-attachments
 * @access  Private
 */
export const suggestAttachments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { subject, body, context } = req.body;

    if (!subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Subject and body are required',
      });
    }

    const result = await generativeService.suggestAttachments(userId, { subject, body, context });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Suggest attachments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suggest attachments',
    });
  }
};

/**
 * @desc    Check spam score
 * @route   POST /api/ai/check-spam
 * @access  Private
 */
export const checkSpam = async (req, res) => {
  try {
    const userId = req.user._id;
    const { subject, body, fromEmail } = req.body;

    if (!subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Subject and body are required',
      });
    }

    const result = await generativeService.checkSpamScore(userId, { subject, body, fromEmail });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Check spam error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check spam score',
    });
  }
};

/**
 * @desc    Create template from successful email
 * @route   POST /api/ai/create-template
 * @access  Private
 */
export const createTemplate = async (req, res) => {
  try {
    const userId = req.user._id;
    const { emailId } = req.body;

    if (!emailId) {
      return res.status(400).json({
        success: false,
        message: 'Email ID is required',
      });
    }

    const result = await generativeService.createTemplateFromEmail(userId, emailId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create template',
    });
  }
};

/**
 * @desc    Get industry-specific templates
 * @route   GET /api/ai/templates/:industry
 * @access  Private
 */
export const getIndustryTemplates = async (req, res) => {
  try {
    const userId = req.user._id;
    const { industry } = req.params;
    const { purpose, tone } = req.query;

    const result = await generativeService.generateIndustryTemplate(userId, { 
      industry, 
      purpose: purpose || 'general outreach',
      tone: tone || 'professional'
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get industry templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate template',
    });
  }
};

/**
 * @desc    Translate email
 * @route   POST /api/ai/translate-email
 * @access  Private
 */
export const translateEmail = async (req, res) => {
  try {
    const userId = req.user._id;
    const { content, targetLanguage } = req.body;

    if (!content || !targetLanguage) {
      return res.status(400).json({
        success: false,
        message: 'Content and target language are required',
      });
    }

    const result = await generativeService.translateEmail(userId, { content, targetLanguage });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Translate email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to translate email',
    });
  }
};

/**
 * @desc    Check brand voice consistency
 * @route   POST /api/ai/check-brand-voice
 * @access  Private
 */
export const checkBrandVoice = async (req, res) => {
  try {
    const userId = req.user._id;
    const { content, brandGuidelines } = req.body;

    if (!content || !brandGuidelines) {
      return res.status(400).json({
        success: false,
        message: 'Content and brand guidelines are required',
      });
    }

    const result = await generativeService.checkBrandVoice(userId, { content, brandGuidelines });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Check brand voice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check brand voice',
    });
  }
};
