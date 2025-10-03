import Email from '../models/Email.js';
import User from '../models/User.js';
import Campaign from '../models/Campaign.js';
import {
  createTransporter,
  generateTrackingId,
  sendTrackedEmail,
} from '../utils/emailService.js';

/**
 * @desc    Send a tracked email
 * @route   POST /api/emails/send
 * @access  Private
 */
export const sendEmail = async (req, res) => {
  try {
    const { subject, recipients, body, campaignId } = req.body;

    // Get user with SMTP config
    const user = await User.findById(req.user._id).select('+smtpConfig.password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if SMTP is configured
    if (!user.smtpConfig.host || !user.smtpConfig.user) {
      return res.status(400).json({
        success: false,
        message: 'SMTP configuration not found. Please configure SMTP settings first.',
      });
    }

    // Generate tracking ID
    const trackingId = generateTrackingId();

    // Create email record
    const email = await Email.create({
      userId: user._id,
      campaignId: campaignId || null,
      trackingId,
      subject,
      recipients,
      body,
      status: 'pending',
    });

    // If campaignId is provided, add email to campaign
    if (campaignId) {
      const campaign = await Campaign.findOne({ _id: campaignId, userId: user._id });
      if (campaign) {
        campaign.emails.push(email._id);
        await campaign.save();
      }
    }

    try {
      // Create transporter
      const transporter = createTransporter(user.smtpConfig);

      // Send email with tracking
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      console.log('📧 Sending email with tracking ID:', trackingId);
      console.log('🔗 Backend URL for tracking:', backendUrl);
      
      const info = await sendTrackedEmail(
        transporter,
        {
          subject,
          recipients,
          body,
          smtpConfig: user.smtpConfig,
        },
        trackingId,
        backendUrl
      );
      
      console.log('✅ Email sent successfully. Message ID:', info.messageId);

      // Update email status
      email.status = 'sent';
      email.sentAt = new Date();
      email.metadata.messageId = info.messageId;
      await email.save();

      res.status(201).json({
        success: true,
        message: 'Email sent successfully',
        data: {
          emailId: email._id,
          trackingId: email.trackingId,
          subject: email.subject,
          recipients: email.recipients,
          sentAt: email.sentAt,
        },
      });
    } catch (error) {
      // Update email status to failed
      email.status = 'failed';
      email.metadata.errorMessage = error.message;
      await email.save();

      throw error;
    }
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending email',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all emails for a user
 * @route   GET /api/emails
 * @access  Private
 */
export const getEmails = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const emails = await Email.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-body.html -body.text');

    const total = await Email.countDocuments({ userId: req.user._id });

    res.json({
      success: true,
      data: {
        emails,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get emails error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching emails',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single email by ID
 * @route   GET /api/emails/:id
 * @access  Private
 */
export const getEmailById = async (req, res) => {
  try {
    const email = await Email.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found',
      });
    }

    res.json({
      success: true,
      data: email,
    });
  } catch (error) {
    console.error('Get email by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching email',
      error: error.message,
    });
  }
};

/**
 * @desc    Get email analytics/stats
 * @route   GET /api/emails/analytics/stats
 * @access  Private
 */
export const getEmailStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Email.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalEmails: { $sum: 1 },
          totalSent: {
            $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] },
          },
          totalFailed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
          },
          totalOpens: { $sum: '$tracking.totalOpens' },
          totalClicks: { $sum: '$tracking.totalClicks' },
          uniqueOpens: {
            $sum: {
              $cond: [{ $gt: ['$tracking.totalOpens', 0] }, 1, 0],
            },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalEmails: 0,
      totalSent: 0,
      totalFailed: 0,
      totalOpens: 0,
      totalClicks: 0,
      uniqueOpens: 0,
    };

    // Calculate rates
    result.openRate =
      result.totalSent > 0
        ? ((result.uniqueOpens / result.totalSent) * 100).toFixed(2)
        : 0;
    result.clickRate =
      result.totalSent > 0
        ? ((result.totalClicks / result.totalSent) * 100).toFixed(2)
        : 0;

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get email stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching email statistics',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete an email
 * @route   DELETE /api/emails/:id
 * @access  Private
 */
export const deleteEmail = async (req, res) => {
  try {
    const email = await Email.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found',
      });
    }

    await email.deleteOne();

    res.json({
      success: true,
      message: 'Email deleted successfully',
    });
  } catch (error) {
    console.error('Delete email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting email',
      error: error.message,
    });
  }
};
