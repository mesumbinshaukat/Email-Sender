import Sequence from '../models/Sequence.js';
import Email from '../models/Email.js';
import User from '../models/User.js';
import { sendTrackedEmail } from '../utils/emailService.js';
import crypto from 'crypto';

// @desc    Create new sequence
// @route   POST /api/sequences
// @access  Private
export const createSequence = async (req, res) => {
  try {
    const { name, description, campaignId, tags, settings, steps } = req.body;

    const sequence = await Sequence.create({
      name,
      description,
      userId: req.user._id,
      campaignId,
      tags: tags || [],
      settings: {
        maxSteps: settings?.maxSteps || 10,
        respectTimezone: settings?.respectTimezone !== false,
        skipWeekends: settings?.skipWeekends || false,
        stopOnReply: settings?.stopOnReply !== false,
        stopOnUnsubscribe: settings?.stopOnUnsubscribe !== false,
        aiOptimization: settings?.aiOptimization || false
      },
      steps: steps || []
    });

    await sequence.save();

    res.status(201).json({
      success: true,
      message: 'Sequence created successfully',
      data: sequence
    });
  } catch (error) {
    console.error('Create sequence error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating sequence',
      error: error.message
    });
  }
};

// @desc    Get all sequences for user
// @route   GET /api/sequences
// @access  Private
export const getSequences = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const query = { userId: req.user._id };
    if (status) {
      query.status = status;
    }

    const sequences = await Sequence.find(query)
      .populate('campaignId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Sequence.countDocuments(query);

    res.json({
      success: true,
      data: sequences,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: sequences.length
      }
    });
  } catch (error) {
    console.error('Get sequences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sequences',
      error: error.message
    });
  }
};

// @desc    Get single sequence
// @route   GET /api/sequences/:id
// @access  Private
export const getSequence = async (req, res) => {
  try {
    const sequence = await Sequence.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('campaignId', 'name');

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found'
      });
    }

    res.json({
      success: true,
      data: sequence
    });
  } catch (error) {
    console.error('Get sequence error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sequence',
      error: error.message
    });
  }
};

// @desc    Update sequence
// @route   PUT /api/sequences/:id
// @access  Private
export const updateSequence = async (req, res) => {
  try {
    const { name, description, tags, settings, steps, status } = req.body;

    const sequence = await Sequence.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found'
      });
    }

    // Update fields
    if (name) sequence.name = name;
    if (description !== undefined) sequence.description = description;
    if (tags) sequence.tags = tags;
    if (status) sequence.status = status;

    if (settings) {
      sequence.settings = {
        ...sequence.settings,
        ...settings
      };
    }

    if (steps) {
      sequence.steps = steps;
    }

    await sequence.save();

    res.json({
      success: true,
      message: 'Sequence updated successfully',
      data: sequence
    });
  } catch (error) {
    console.error('Update sequence error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating sequence',
      error: error.message
    });
  }
};

// @desc    Delete sequence
// @route   DELETE /api/sequences/:id
// @access  Private
export const deleteSequence = async (req, res) => {
  try {
    const sequence = await Sequence.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found'
      });
    }

    res.json({
      success: true,
      message: 'Sequence deleted successfully'
    });
  } catch (error) {
    console.error('Delete sequence error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting sequence',
      error: error.message
    });
  }
};

// @desc    Add step to sequence
// @route   POST /api/sequences/:id/steps
// @access  Private
export const addSequenceStep = async (req, res) => {
  try {
    const { name, subject, content, delayDays, delayHours, conditions, sendTime } = req.body;

    const sequence = await Sequence.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found'
      });
    }

    const newStep = {
      stepNumber: sequence.steps.length + 1,
      name,
      subject,
      content,
      delayDays: delayDays || 0,
      delayHours: delayHours || 0,
      conditions: conditions || [],
      sendTime: sendTime || 'immediate',
      status: 'draft'
    };

    sequence.steps.push(newStep);
    await sequence.save();

    res.json({
      success: true,
      message: 'Step added successfully',
      data: sequence
    });
  } catch (error) {
    console.error('Add sequence step error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding step',
      error: error.message
    });
  }
};

// @desc    Generate content for sequence step
// @route   POST /api/sequences/:id/generate-content
// @access  Private
export const generateSequenceContent = async (req, res) => {
  try {
    const { stepNumber, prompt, tone, length } = req.body;

    const sequence = await Sequence.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found'
      });
    }

    // Use AI service to generate content
    const aiService = (await import('../services/aiService.js')).default;
    const generatedContent = await aiService.generateEmailContent({
      prompt: prompt || `Generate email content for sequence step ${stepNumber}`,
      tone: tone || 'professional',
      length: length || 'medium',
      context: {
        sequenceName: sequence.name,
        stepNumber,
        previousSteps: sequence.steps.slice(0, stepNumber - 1)
      }
    });

    res.json({
      success: true,
      data: {
        subject: generatedContent.subject,
        content: generatedContent.content,
        aiGenerated: true
      }
    });
  } catch (error) {
    console.error('Generate sequence content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating content',
      error: error.message
    });
  }
};

// @desc    Get sequence analytics
// @route   GET /api/sequences/:id/analytics
// @access  Private
export const getSequenceAnalytics = async (req, res) => {
  try {
    const sequence = await Sequence.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found'
      });
    }

    // Get emails sent as part of this sequence
    const sequenceEmails = await Email.find({
      userId: req.user._id,
      sequenceId: sequence._id
    });

    const analytics = {
      totalSent: sequenceEmails.length,
      totalOpens: sequenceEmails.reduce((sum, email) => sum + (email.tracking?.totalOpens || 0), 0),
      totalClicks: sequenceEmails.reduce((sum, email) => sum + (email.tracking?.totalClicks || 0), 0),
      totalReplies: sequenceEmails.filter(email => email.tracking?.replied).length,
      openRate: sequenceEmails.length > 0 ?
        (sequenceEmails.reduce((sum, email) => sum + (email.tracking?.totalOpens || 0), 0) / sequenceEmails.length) * 100 : 0,
      clickRate: sequenceEmails.length > 0 ?
        (sequenceEmails.reduce((sum, email) => sum + (email.tracking?.totalClicks || 0), 0) / sequenceEmails.length) * 100 : 0,
      replyRate: sequenceEmails.length > 0 ?
        (sequenceEmails.filter(email => email.tracking?.replied).length / sequenceEmails.length) * 100 : 0
    };

    // Update sequence analytics
    sequence.analytics = analytics;
    await sequence.save();

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get sequence analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

// @desc    Start sequence for contacts
// @route   POST /api/sequences/:id/start
// @access  Private
export const startSequence = async (req, res) => {
  try {
    const { contactEmails } = req.body;

    const sequence = await Sequence.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found'
      });
    }

    if (sequence.steps.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Sequence must have at least one step'
      });
    }

    // Update sequence with contacts
    sequence.targetContacts = contactEmails;
    sequence.totalContacts = contactEmails.length;
    sequence.status = 'active';
    await sequence.save();

    // Schedule first step for all contacts
    const firstStep = sequence.steps[0];
    for (const email of contactEmails) {
      // Schedule email (implementation depends on queue system)
      await scheduleSequenceEmail(sequence, firstStep, email, 0);
    }

    res.json({
      success: true,
      message: `Sequence started for ${contactEmails.length} contacts`,
      data: sequence
    });
  } catch (error) {
    console.error('Start sequence error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting sequence',
      error: error.message
    });
  }
};

// Helper function to schedule sequence emails
const scheduleSequenceEmail = async (sequence, step, recipientEmail, delayMinutes = 0) => {
  try {
    const sendTime = new Date();
    sendTime.setMinutes(sendTime.getMinutes() + delayMinutes);

    // Create email record
    const email = await Email.create({
      userId: sequence.userId,
      to: [recipientEmail],
      subject: step.subject,
      htmlBody: step.content,
      sequenceId: sequence._id,
      stepNumber: step.stepNumber,
      status: 'scheduled',
      scheduledFor: sendTime,
      trackingId: generateTrackingId()
    });

    // Add to email queue (implementation depends on your queue system)
    // This would integrate with your existing Bull queue system

    console.log(`✅ Scheduled sequence email: ${sequence.name} step ${step.stepNumber} to ${recipientEmail}`);
  } catch (error) {
    console.error('Schedule sequence email error:', error);
  }
};

// Helper function to generate tracking ID
const generateTrackingId = () => {
  return crypto.randomBytes(16).toString('hex');
};
