import { UnsubscribeSignal, RetentionCampaign, PreferenceCenter } from '../models/Retention.js';
import Contact from '../models/Contact.js';
import Email from '../models/Email.js';

// @desc    Detect and record unsubscribe signals
// @route   POST /api/retention/detect-signal
// @access  Private
export const detectUnsubscribeSignal = async (req, res) => {
  try {
    const { contactId, emailId, signalType, metadata = {} } = req.body;

    // Determine severity and confidence based on signal type
    const { severity, confidence } = getSignalSeverity(signalType, metadata);

    const signal = await UnsubscribeSignal.create({
      contactId,
      userId: req.user._id,
      emailId,
      signalType,
      severity,
      confidence,
      description: generateSignalDescription(signalType, metadata),
      metadata,
    });

    // Trigger retention campaign if severity is high enough
    if (severity === 'high' || severity === 'critical') {
      await triggerRetentionCampaign(contactId, signal._id, signalType);
    }

    res.json({
      success: true,
      data: signal,
      message: 'Unsubscribe signal detected and recorded',
    });
  } catch (error) {
    console.error('Detect unsubscribe signal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error detecting unsubscribe signal',
      error: error.message,
    });
  }
};

// @desc    Get at-risk contacts
// @route   GET /api/retention/at-risk-contacts
// @access  Private
export const getAtRiskContacts = async (req, res) => {
  try {
    const { severity = 'high', limit = 20 } = req.query;

    // Find contacts with recent high-severity signals
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const signals = await UnsubscribeSignal.find({
      userId: req.user._id,
      severity: { $in: severity === 'all' ? ['low', 'medium', 'high', 'critical'] : [severity, 'critical'] },
      detectedAt: { $gte: thirtyDaysAgo },
    })
    .populate('contactId', 'email name')
    .sort({ detectedAt: -1 })
    .limit(parseInt(limit));

    // Group by contact and get most recent signal
    const contactSignals = {};
    signals.forEach(signal => {
      const contactId = signal.contactId._id.toString();
      if (!contactSignals[contactId] || signal.detectedAt > contactSignals[contactId].detectedAt) {
        contactSignals[contactId] = signal;
      }
    });

    const atRiskContacts = Object.values(contactSignals);

    res.json({
      success: true,
      data: atRiskContacts,
      count: atRiskContacts.length,
    });
  } catch (error) {
    console.error('Get at-risk contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching at-risk contacts',
      error: error.message,
    });
  }
};

// @desc    Trigger retention campaign for contact
// @route   POST /api/retention/trigger-campaign/:contactId
// @access  Private
export const triggerRetentionCampaign = async (req, res) => {
  try {
    const { contactId } = req.params;
    const { campaignType = 'win_back', customContent } = req.body;

    // Get the most recent signal for this contact
    const recentSignal = await UnsubscribeSignal.findOne({
      contactId,
      userId: req.user._id,
    }).sort({ detectedAt: -1 });

    if (!recentSignal) {
      return res.status(404).json({
        success: false,
        message: 'No recent unsubscribe signals found for this contact',
      });
    }

    // Generate campaign content
    const campaignContent = customContent || await generateRetentionContent(campaignType, recentSignal);

    // Schedule campaign (send immediately for now, could be delayed)
    const campaign = await RetentionCampaign.create({
      contactId,
      userId: req.user._id,
      triggerSignal: recentSignal._id,
      campaignType,
      scheduledFor: new Date(),
      content: campaignContent,
      aiGenerated: !customContent,
    });

    // Mark as sent immediately (in real implementation, this would be queued)
    campaign.status = 'sent';
    campaign.sentAt = new Date();
    await campaign.save();

    // Create and send the retention email
    await sendRetentionEmail(contactId, campaign);

    res.json({
      success: true,
      data: campaign,
      message: 'Retention campaign triggered successfully',
    });
  } catch (error) {
    console.error('Trigger retention campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Error triggering retention campaign',
      error: error.message,
    });
  }
};

// @desc    Get contact preferences
// @route   GET /api/retention/preferences/:contactId
// @access  Private
export const getContactPreferences = async (req, res) => {
  try {
    const { contactId } = req.params;

    let preferences = await PreferenceCenter.findOne({
      contactId,
      userId: req.user._id,
    });

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await PreferenceCenter.create({
        contactId,
        userId: req.user._id,
        preferences: {
          frequency: 'weekly',
          contentTypes: ['newsletters', 'product_updates'],
          communicationChannels: ['email'],
        },
      });
    }

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Get contact preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contact preferences',
      error: error.message,
    });
  }
};

// @desc    Update contact preferences
// @route   PUT /api/retention/update-preferences
// @access  Private (or public via token)
export const updateContactPreferences = async (req, res) => {
  try {
    const { contactId, preferences, unsubscribeReasons, token } = req.body;

    // Find by contactId and userId, or by token for public access
    const query = token ?
      { unsubscribeToken: token } :
      { contactId, userId: req.user._id };

    const preferenceCenter = await PreferenceCenter.findOne(query);

    if (!preferenceCenter) {
      return res.status(404).json({
        success: false,
        message: 'Preference center not found',
      });
    }

    // Update preferences
    if (preferences) {
      preferenceCenter.preferences = { ...preferenceCenter.preferences, ...preferences };
    }

    // Add unsubscribe reasons if provided
    if (unsubscribeReasons) {
      preferenceCenter.unsubscribeReasons.push(...unsubscribeReasons.map(reason => ({
        ...reason,
        reportedAt: new Date(),
      })));
    }

    preferenceCenter.lastUpdated = new Date();
    await preferenceCenter.save();

    res.json({
      success: true,
      data: preferenceCenter,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    console.error('Update contact preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating preferences',
      error: error.message,
    });
  }
};

// @desc    Generate win-back offer
// @route   POST /api/retention/win-back-offer
// @access  Private
export const generateWinBackOffer = async (req, res) => {
  try {
    const { contactId, offerType = 'discount' } = req.body;

    const contact = await Contact.findOne({
      _id: contactId,
      userId: req.user._id,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    // Generate personalized win-back offer
    const offer = await generatePersonalizedOffer(contact, offerType);

    res.json({
      success: true,
      data: offer,
    });
  } catch (error) {
    console.error('Generate win-back offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating win-back offer',
      error: error.message,
    });
  }
};

// @desc    Get retention analytics
// @route   GET /api/retention/analytics
// @access  Private
export const getRetentionAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get signal statistics
    const signalStats = await UnsubscribeSignal.aggregate([
      { $match: { userId: req.user._id, detectedAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
        }
      }
    ]);

    // Get campaign effectiveness
    const campaignStats = await RetentionCampaign.aggregate([
      { $match: { userId: req.user._id, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgEffectiveness: { $avg: '$effectiveness.score' },
        }
      }
    ]);

    // Get top unsubscribe reasons
    const reasonStats = await PreferenceCenter.aggregate([
      { $match: { userId: req.user._id } },
      { $unwind: '$unsubscribeReasons' },
      {
        $group: {
          _id: '$unsubscribeReasons.reason',
          count: { $sum: 1 },
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const analytics = {
      signals: {
        total: signalStats.reduce((sum, stat) => sum + stat.count, 0),
        bySeverity: signalStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
      },
      campaigns: {
        total: campaignStats.reduce((sum, stat) => sum + stat.count, 0),
        byStatus: campaignStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        averageEffectiveness: campaignStats.reduce((sum, stat) => sum + (stat.avgEffectiveness || 0), 0) / campaignStats.length,
      },
      topReasons: reasonStats.map(stat => ({
        reason: stat._id,
        count: stat.count,
      })),
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Get retention analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching retention analytics',
      error: error.message,
    });
  }
};

// Helper functions
const getSignalSeverity = (signalType, metadata) => {
  switch (signalType) {
    case 'unsubscribe_click':
      return { severity: 'critical', confidence: 1.0 };
    case 'complaint':
      return { severity: 'critical', confidence: 0.95 };
    case 'bounce':
      return metadata.bounceType === 'hard' ? { severity: 'critical', confidence: 0.9 } : { severity: 'high', confidence: 0.8 };
    case 'negative_reply':
      return metadata.replySentiment < -0.5 ? { severity: 'high', confidence: 0.85 } : { severity: 'medium', confidence: 0.7 };
    case 'low_engagement':
      return metadata.engagementScore < 20 ? { severity: 'medium', confidence: 0.75 } : { severity: 'low', confidence: 0.6 };
    case 'frequency_complaint':
      return { severity: 'high', confidence: 0.8 };
    default:
      return { severity: 'low', confidence: 0.5 };
  }
};

const generateSignalDescription = (signalType, metadata) => {
  switch (signalType) {
    case 'unsubscribe_click':
      return 'Contact clicked unsubscribe link';
    case 'complaint':
      return `Complaint reported: ${metadata.complaintReason || 'Unknown reason'}`;
    case 'bounce':
      return `Email bounced: ${metadata.bounceType || 'Unknown'} bounce`;
    case 'negative_reply':
      return 'Received negative reply from contact';
    case 'low_engagement':
      return `Low engagement detected (score: ${metadata.engagementScore || 0})`;
    case 'frequency_complaint':
      return 'Contact complained about email frequency';
    default:
      return 'Unsubscribe signal detected';
  }
};

const generateRetentionContent = async (campaignType, signal) => {
  try {
    const aiService = (await import('../services/aiService.js')).default;

    const messages = [
      {
        role: 'system',
        content: `Generate personalized retention campaign content based on the unsubscribe signal. Create compelling subject line and email body that addresses the specific concern and offers value to win the contact back.`
      },
      {
        role: 'user',
        content: `Generate retention email content for a ${campaignType} campaign.

Signal type: ${signal.signalType}
Signal description: ${signal.description}
Severity: ${signal.severity}

Create a subject line and email body that:
1. Acknowledges the concern
2. Offers value or solution
3. Includes clear call-to-action
4. Maintains positive, helpful tone

Return as JSON with subject and body fields.`
      }
    ];

    const response = await aiService.callAI(messages, signal.userId, 'retention_campaign', {
      temperature: 0.7,
      maxTokens: 600,
    });

    return JSON.parse(response);
  } catch (error) {
    console.error('Generate retention content error:', error);
    // Fallback content
    return {
      subject: 'We miss hearing from you!',
      body: 'We noticed you might be considering unsubscribing. We value your engagement and would love to continue providing you with valuable content. What can we do to make your experience better?',
      callToAction: 'Reply to this email or update your preferences',
    };
  }
};

const sendRetentionEmail = async (contactId, campaign) => {
  try {
    const contact = await Contact.findById(contactId);
    if (!contact) return;

    const email = await Email.create({
      userId: campaign.userId,
      to: [contact.email],
      subject: campaign.content.subject,
      htmlBody: campaign.content.body,
      status: 'sent',
      sentAt: new Date(),
    });

    // In real implementation, this would use the actual email sending service
    console.log(`✅ Sent retention email to ${contact.email}: ${campaign.content.subject}`);
  } catch (error) {
    console.error('Send retention email error:', error);
  }
};

const generatePersonalizedOffer = async (contact, offerType) => {
  // Generate personalized win-back offers based on contact data and offer type
  const offers = {
    discount: {
      title: 'Special Discount Offer',
      description: `Get 25% off your next ${contact.company?.industry || 'service'} with code WINBACK25`,
      value: '25% discount',
      expiresIn: '7 days',
    },
    content_upgrade: {
      title: 'Exclusive Content Access',
      description: 'Get access to our premium content library and exclusive insights',
      value: 'Premium content access',
      expiresIn: '30 days',
    },
    consultation: {
      title: 'Free Consultation',
      description: 'Schedule a free 30-minute consultation to discuss your specific needs',
      value: 'Free consultation',
      expiresIn: '14 days',
    },
  };

  return offers[offerType] || offers.discount;
};
