// express-async-handler removed - using native async/await
import { Gamification, VoiceEmail, TemplateMarketplace, AICoach, BlockchainVerification } from '../models/gamificationSchemas.js';
import Email from '../models/Email.js';
import { getEnvVar } from '../utils/envManager.js';

// Gamification Controllers
const getGamificationProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    let profile = await Gamification.findOne({ user: userId });

    if (!profile) {
      profile = await Gamification.create({
        user: userId,
        achievements: [
          { type: 'emails_sent', count: 0, target: 10 },
          { type: 'open_rate', count: 0, target: 25 },
          { type: 'campaign_completed', count: 0, target: 1 }
        ]
      });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateGamification = async (req, res) => {
  try {
    const { action, value } = req.body;
    const userId = req.user._id;

    let profile = await Gamification.findOne({ user: userId });

    if (!profile) {
      profile = await Gamification.create({ user: userId });
    }

    // Update points and achievements based on action
    switch (action) {
      case 'email_sent':
        profile.points += 10;
        profile.achievements.find(a => a.type === 'emails_sent').count += 1;
        break;
      case 'campaign_completed':
        profile.points += 50;
        profile.achievements.find(a => a.type === 'campaign_completed').count += 1;
        break;
      case 'high_open_rate':
        profile.points += 25;
        break;
    }

    // Check for level up
    profile.level = Math.floor(profile.points / 100) + 1;

    await profile.save();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Voice-to-Email Controllers
const createVoiceEmail = async (req, res) => {
  try {
    const { audioFile } = req.body;
    const userId = req.user._id;

    const voiceEmail = await VoiceEmail.create({
      user: userId,
      audioUrl: audioFile,
      status: 'processing'
    });

    // Start async processing
    processVoiceEmail(voiceEmail._id);

    res.status(201).json(voiceEmail);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getVoiceEmails = async (req, res) => {
  try {
    const userId = req.user._id;

    const voiceEmails = await VoiceEmail.find({ user: userId }).sort({ createdAt: -1 });
    res.json(voiceEmails);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const processVoiceEmail = async (voiceEmailId) => {
  try {
    const voiceEmail = await VoiceEmail.findById(voiceEmailId);
    if (!voiceEmail) return;

    // Simulate voice processing (would integrate with speech-to-text API)
    await new Promise(resolve => setTimeout(resolve, 3000));

    voiceEmail.transcription = "This is a sample transcription of the voice message.";
    voiceEmail.status = 'transcribed';

    // Generate email content
    await new Promise(resolve => setTimeout(resolve, 2000));

    voiceEmail.emailContent = {
      subject: "Voice Message: Important Update",
      body: "Dear recipient,\n\n" + voiceEmail.transcription + "\n\nBest regards,\nYour AI Assistant",
      html: `<p>Dear recipient,</p><p>${voiceEmail.transcription}</p><p>Best regards,<br>Your AI Assistant</p>`
    };

    voiceEmail.status = 'generated';
    voiceEmail.confidence = 0.92;

    await voiceEmail.save();

  } catch (error) {
    console.error('Voice processing failed:', error);
    voiceEmail.status = 'failed';
    await voiceEmail.save();
  }
};

// Template Marketplace Controllers
const getTemplates = async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = { isActive: true };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const templates = await TemplateMarketplace.find(query)
      .populate('creator', 'name')
      .sort({ downloads: -1, rating: -1 });

    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createTemplate = async (req, res) => {
  try {
    const { name, description, category, html, css, variables, price, tags } = req.body;
    const userId = req.user._id;

    const template = await TemplateMarketplace.create({
      creator: userId,
      name,
      description,
      category,
      html,
      css,
      variables,
      price,
      tags
    });

    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const purchaseTemplate = async (req, res) => {
  try {
    const templateId = req.params.id;
    const userId = req.user._id;

    const template = await TemplateMarketplace.findById(templateId);

    if (!template) {
      res.status(404);
      throw new Error('Template not found');
    }

    // In production, handle payment processing
    template.downloads += 1;
    await template.save();

    res.json({
      template,
      message: 'Template purchased successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// AI Coach Controllers
const getAICoachInsights = async (req, res) => {
  try {
    const userId = req.user._id;

    let coach = await AICoach.findOne({ user: userId });

    if (!coach || !coach.lastAnalyzed || new Date() - coach.lastAnalyzed > 24 * 60 * 60 * 1000) {
      // Generate new insights
      coach = await generateInsights(userId);
    }

    res.json(coach);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const implementInsight = async (req, res) => {
  try {
    const { insightId } = req.body;
    const userId = req.user._id;

    const coach = await AICoach.findOne({ user: userId });

    if (coach) {
      const insight = coach.insights.id(insightId);
      if (insight) {
        insight.implemented = true;
      }
      await coach.save();
    }

    res.json({ message: 'Insight marked as implemented' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Blockchain Verification Controllers
const createBlockchainVerification = async (req, res) => {
  try {
    const { emailId } = req.body;
    const userId = req.user._id;

    const email = await Email.findById(emailId);

    if (!email) {
      res.status(404);
      throw new Error('Email not found');
    }

    // Create hash of email content
    const crypto = await import('crypto');
    const hash = crypto.default.createHash('sha256')
      .update(JSON.stringify({
        from: email.from,
        to: email.to,
        subject: email.subject,
        content: email.html || email.text,
        timestamp: email.createdAt
      }))
      .digest('hex');

    const verification = await BlockchainVerification.create({
      email: emailId,
      user: userId,
      hash,
      status: 'pending'
    });

    // Simulate blockchain recording
    recordOnBlockchain(verification._id);

    res.status(201).json(verification);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getBlockchainVerifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const verifications = await BlockchainVerification.find({ user: userId })
      .populate('email')
      .sort({ createdAt: -1 });

    res.json(verifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const verifyBlockchainRecord = async (req, res) => {
  try {
    const verificationId = req.params.id;

    const verification = await BlockchainVerification.findById(verificationId);

    if (!verification) {
      res.status(404);
      throw new Error('Verification not found');
    }

    // Simulate blockchain verification
    const isValid = Math.random() > 0.1; // 90% success rate

    res.json({
      verification,
      isValid,
      blockchainUrl: `https://polygonscan.com/tx/${verification.transactionHash}`
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper functions
const generateInsights = async (userId) => {
  let coach = await AICoach.findOne({ user: userId });

  if (!coach) {
    coach = await AICoach.create({ user: userId });
  }

  // Analyze user performance
  const emails = await Email.find({ user: userId }).limit(100);
  const totalEmails = emails.length;
  const openRate = emails.filter(e => e.openedAt).length / totalEmails * 100;

  const insights = [];

  if (openRate < 20) {
    insights.push({
      type: 'subject_line',
      message: 'Your subject lines could be more engaging',
      impact: 'high',
      action: 'Use action words, personalization, and keep under 50 characters'
    });
  }

  if (openRate > 30) {
    insights.push({
      type: 'send_timing',
      message: 'Great job with send timing!',
      impact: 'medium',
      action: 'Continue optimizing send times based on audience behavior'
    });
  }

  coach.insights = insights;
  coach.performance.currentScore = Math.min(100, openRate * 2);
  coach.lastAnalyzed = new Date();

  await coach.save();
  return coach;
};

const recordOnBlockchain = async (verificationId) => {
  try {
    const verification = await BlockchainVerification.findById(verificationId);
    if (!verification) return;

    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 2000));

    verification.transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    verification.blockNumber = Math.floor(Math.random() * 1000000);
    verification.timestamp = new Date();
    verification.status = 'confirmed';
    verification.verificationUrl = `https://polygonscan.com/tx/${verification.transactionHash}`;

    await verification.save();

  } catch (error) {
    console.error('Blockchain recording failed:', error);
    verification.status = 'failed';
    await verification.save();
  }
};

export {
  // Gamification
  getGamificationProfile,
  updateGamification,

  // Voice-to-Email
  createVoiceEmail,
  getVoiceEmails,

  // Template Marketplace
  getTemplates,
  createTemplate,
  purchaseTemplate,

  // AI Coach
  getAICoachInsights,
  implementInsight,

  // Blockchain Verification
  createBlockchainVerification,
  getBlockchainVerifications,
  verifyBlockchainRecord
};
