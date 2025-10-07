import LeadScore from '../models/LeadScore.js';
import Contact from '../models/Contact.js';
import Email from '../models/Email.js';

// @desc    Calculate lead score for contact
// @route   POST /api/leads/calculate-score/:contactId
// @access  Private
export const calculateLeadScore = async (req, res) => {
  try {
    const { contactId } = req.params;

    console.log('🧮 Calculating lead score for contact:', contactId);

    // Get contact data
    const contact = await Contact.findOne({
      _id: contactId,
      userId: req.user._id,
    });

    if (!contact) {
      console.error('❌ Contact not found for lead scoring:', contactId);
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    // Find or create lead score
    let leadScore = await LeadScore.findOne({
      contactId,
      userId: req.user._id,
    });

    if (!leadScore) {
      leadScore = new LeadScore({
        contactId,
        userId: req.user._id,
      });
    }

    // Gather engagement data
    const engagementData = await gatherEngagementData(contactId, req.user._id);

    console.log('📊 Engagement data gathered:', engagementData);

    // Update scoring factors
    leadScore.scoringFactors = {
      emailOpens: { count: engagementData.emailOpens, weight: 0.2 },
      emailClicks: { count: engagementData.emailClicks, weight: 0.3 },
      websiteVisits: { count: engagementData.websiteVisits || 0, weight: 0.25 },
      contentDownloads: { count: engagementData.contentDownloads || 0, weight: 0.15 },
      socialEngagement: { count: engagementData.socialEngagement || 0, weight: 0.1 },
      replyCount: { count: engagementData.replies, weight: 0.4 },
      meetingRequests: { count: engagementData.meetingRequests, weight: 0.5 },
    };

    // Calculate scores
    leadScore.calculateScores();

    // Check for alerts
    await checkForAlerts(leadScore, engagementData.previousScore);

    await leadScore.save();

    console.log('✅ Lead score calculated:', {
      contactId,
      score: leadScore.overallScore,
      grade: leadScore.leadGrade,
      status: leadScore.leadStatus
    });

    res.json({
      success: true,
      data: leadScore,
      message: 'Lead score calculated successfully',
    });
  } catch (error) {
    console.error('❌ Calculate lead score error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating lead score',
      error: error.message,
    });
  }
};

// @desc    Get lead score for contact
// @route   GET /api/leads/score/:contactId
// @access  Private
export const getLeadScore = async (req, res) => {
  try {
    const { contactId } = req.params;

    console.log('📊 Fetching lead score for contact:', contactId);

    const leadScore = await LeadScore.findOne({
      contactId,
      userId: req.user._id,
    });

    if (!leadScore) {
      console.log('ℹ️ No lead score found, returning default');
      return res.json({
        success: true,
        data: {
          overallScore: 0,
          leadGrade: 'F',
          leadStatus: 'cold',
          scoreBreakdown: {
            engagementScore: 0,
            demographicScore: 0,
            behavioralScore: 0,
            intentScore: 0,
            firmographicScore: 0,
          },
          conversionProbability: 0,
          recommendations: [],
        },
        message: 'No lead score calculated yet',
      });
    }

    console.log('✅ Lead score retrieved:', {
      contactId,
      score: leadScore.overallScore,
      grade: leadScore.leadGrade
    });

    res.json({
      success: true,
      data: leadScore,
    });
  } catch (error) {
    console.error('❌ Get lead score error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lead score',
      error: error.message,
    });
  }
};

// @desc    Get hot leads
// @route   GET /api/leads/hot-leads
// @access  Private
export const getHotLeads = async (req, res) => {
  try {
    const { limit = 20, minScore = 70 } = req.query;

    console.log('🔥 Fetching hot leads:', { limit, minScore });

    const hotLeads = await LeadScore.find({
      userId: req.user._id,
      overallScore: { $gte: parseInt(minScore) },
    })
    .populate('contactId', 'name email company')
    .sort({ overallScore: -1, 'scoringMetadata.lastCalculated': -1 })
    .limit(parseInt(limit))
    .exec();

    console.log(`✅ Found ${hotLeads.length} hot leads`);

    res.json({
      success: true,
      data: hotLeads,
      count: hotLeads.length,
    });
  } catch (error) {
    console.error('❌ Get hot leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hot leads',
      error: error.message,
    });
  }
};

// @desc    Get sales-ready leads
// @route   GET /api/leads/sales-ready
// @access  Private
export const getSalesReadyLeads = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    console.log('🎯 Fetching sales-ready leads');

    // Leads that are hot, have high intent, and recent activity
    const salesReadyLeads = await LeadScore.find({
      userId: req.user._id,
      overallScore: { $gte: 75 },
      leadStatus: { $in: ['hot', 'qualified'] },
      'scoreBreakdown.intentScore': { $gte: 60 },
      'scoringMetadata.lastCalculated': {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      },
    })
    .populate('contactId', 'name email company position')
    .sort({ overallScore: -1, 'scoreBreakdown.intentScore': -1 })
    .limit(parseInt(limit))
    .exec();

    console.log(`✅ Found ${salesReadyLeads.length} sales-ready leads`);

    res.json({
      success: true,
      data: salesReadyLeads,
      count: salesReadyLeads.length,
    });
  } catch (error) {
    console.error('❌ Get sales-ready leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales-ready leads',
      error: error.message,
    });
  }
};

// @desc    Get conversion probability for contact
// @route   GET /api/leads/conversion-probability/:contactId
// @access  Private
export const getConversionProbability = async (req, res) => {
  try {
    const { contactId } = req.params;

    console.log('🎲 Calculating conversion probability for:', contactId);

    const leadScore = await LeadScore.findOne({
      contactId,
      userId: req.user._id,
    });

    if (!leadScore) {
      console.log('ℹ️ No lead score found for conversion probability');
      return res.json({
        success: true,
        data: {
          probability: 0,
          confidence: 0,
          factors: [],
        },
      });
    }

    // Calculate probability based on score and factors
    const probability = leadScore.conversionProbability;
    const confidence = leadScore.scoringMetadata.confidence;

    const factors = [
      {
        factor: 'Overall Score',
        impact: leadScore.overallScore >= 80 ? 'high_positive' : leadScore.overallScore >= 60 ? 'positive' : 'neutral',
        value: leadScore.overallScore,
      },
      {
        factor: 'Intent Signals',
        impact: leadScore.scoreBreakdown.intentScore >= 70 ? 'high_positive' : leadScore.scoreBreakdown.intentScore >= 40 ? 'positive' : 'neutral',
        value: leadScore.scoreBreakdown.intentScore,
      },
      {
        factor: 'Engagement Level',
        impact: leadScore.scoreBreakdown.engagementScore >= 60 ? 'positive' : 'neutral',
        value: leadScore.scoreBreakdown.engagementScore,
      },
    ];

    console.log('✅ Conversion probability calculated:', {
      contactId,
      probability: Math.round(probability * 100) + '%',
      confidence: Math.round(confidence * 100) + '%'
    });

    res.json({
      success: true,
      data: {
        probability,
        confidence,
        factors,
        predictedValue: leadScore.predictedValue,
      },
    });
  } catch (error) {
    console.error('❌ Get conversion probability error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating conversion probability',
      error: error.message,
    });
  }
};

// @desc    Update lead score manually
// @route   PUT /api/leads/update-score
// @access  Private
export const updateLeadScore = async (req, res) => {
  try {
    const { contactId, adjustments, notes } = req.body;

    console.log('🔧 Updating lead score manually for:', contactId);

    const leadScore = await LeadScore.findOne({
      contactId,
      userId: req.user._id,
    });

    if (!leadScore) {
      console.error('❌ Lead score not found for update');
      return res.status(404).json({
        success: false,
        message: 'Lead score not found',
      });
    }

    // Apply manual adjustments (if provided)
    if (adjustments) {
      Object.keys(adjustments).forEach(key => {
        if (leadScore.scoringFactors[key]) {
          leadScore.scoringFactors[key].count = adjustments[key];
        }
      });

      // Recalculate scores
      leadScore.calculateScores();
      leadScore.scoringMetadata.lastCalculated = new Date();

      // Add note about manual adjustment
      if (notes) {
        leadScore.alerts.push({
          type: 'score_increased',
          message: `Manual score adjustment: ${notes}`,
          triggeredAt: new Date(),
        });
      }

      await leadScore.save();

      console.log('✅ Lead score updated manually:', {
        contactId,
        newScore: leadScore.overallScore,
        grade: leadScore.leadGrade
      });
    }

    res.json({
      success: true,
      data: leadScore,
      message: 'Lead score updated successfully',
    });
  } catch (error) {
    console.error('❌ Update lead score error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating lead score',
      error: error.message,
    });
  }
};

// @desc    Get lead scoring analytics
// @route   GET /api/leads/analytics
// @access  Private
export const getLeadAnalytics = async (req, res) => {
  try {
    console.log('📈 Generating lead scoring analytics');

    // Get score distribution
    const scoreDistribution = await LeadScore.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $gte: ['$overallScore', 90] }, then: '90-100' },
                { case: { $gte: ['$overallScore', 80] }, then: '80-89' },
                { case: { $gte: ['$overallScore', 70] }, then: '70-79' },
                { case: { $gte: ['$overallScore', 60] }, then: '60-69' },
                { case: { $gte: ['$overallScore', 50] }, then: '50-59' },
                { case: { $gte: ['$overallScore', 40] }, then: '40-49' },
                { case: { $gte: ['$overallScore', 30] }, then: '30-39' },
                { case: { $gte: ['$overallScore', 20] }, then: '20-29' },
                { case: { $gte: ['$overallScore', 10] }, then: '10-19' },
              ],
              default: '0-9'
            }
          },
          count: { $sum: 1 },
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get grade distribution
    const gradeDistribution = await LeadScore.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$leadGrade',
          count: { $sum: 1 },
          avgScore: { $avg: '$overallScore' },
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get status distribution
    const statusDistribution = await LeadScore.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$leadStatus',
          count: { $sum: 1 },
          avgScore: { $avg: '$overallScore' },
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get conversion probability insights
    const probabilityInsights = await LeadScore.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          avgProbability: { $avg: '$conversionProbability' },
          highProbabilityCount: {
            $sum: { $cond: [{ $gte: ['$conversionProbability', 0.7] }, 1, 0] }
          },
          totalLeads: { $sum: 1 },
        }
      }
    ]);

    const analytics = {
      scoreDistribution,
      gradeDistribution,
      statusDistribution,
      probabilityInsights: probabilityInsights[0] || {
        avgProbability: 0,
        highProbabilityCount: 0,
        totalLeads: 0,
      },
      summary: {
        totalScoredLeads: await LeadScore.countDocuments({ userId: req.user._id }),
        hotLeadsCount: await LeadScore.countDocuments({
          userId: req.user._id,
          leadStatus: 'hot'
        }),
        averageScore: await LeadScore.aggregate([
          { $match: { userId: req.user._id } },
          { $group: { _id: null, avg: { $avg: '$overallScore' } } }
        ]).then(result => result[0]?.avg || 0),
      },
    };

    console.log('✅ Lead analytics generated');

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('❌ Get lead analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lead analytics',
      error: error.message,
    });
  }
};

// Helper function to gather engagement data
const gatherEngagementData = async (contactId, userId) => {
  try {
    console.log('📊 Gathering engagement data for contact:', contactId);

    // Get emails sent to this contact
    const emails = await Email.find({
      userId,
      to: { $regex: new RegExp(contactId, 'i') }, // Simplified - would need better matching
    });

    let emailOpens = 0;
    let emailClicks = 0;
    let replies = 0;
    let meetingRequests = 0;

    // Aggregate engagement data from emails
    for (const email of emails) {
      emailOpens += email.tracking?.totalOpens || 0;
      emailClicks += email.tracking?.totalClicks || 0;

      // Check for replies (simplified)
      if (email.tracking?.replied) {
        replies += 1;
      }

      // Check for meeting requests in replies (would need NLP analysis)
      // For now, simplified
      meetingRequests += Math.random() > 0.9 ? 1 : 0; // Mock data
    }

    // Get previous score for comparison
    const previousScore = await LeadScore.findOne({ contactId, userId }).select('overallScore');

    return {
      emailOpens,
      emailClicks,
      replies,
      meetingRequests,
      websiteVisits: Math.floor(Math.random() * 10), // Mock data
      contentDownloads: Math.floor(Math.random() * 5), // Mock data
      socialEngagement: Math.floor(Math.random() * 3), // Mock data
      previousScore: previousScore?.overallScore || 0,
    };
  } catch (error) {
    console.error('❌ Error gathering engagement data:', error);
    return {
      emailOpens: 0,
      emailClicks: 0,
      replies: 0,
      meetingRequests: 0,
      websiteVisits: 0,
      contentDownloads: 0,
      socialEngagement: 0,
      previousScore: 0,
    };
  }
};

// Helper function to check for alerts
const checkForAlerts = async (leadScore, previousScore) => {
  try {
    const alerts = [];

    // Score increase alert
    if (leadScore.overallScore > previousScore + 10) {
      alerts.push({
        type: 'score_increased',
        message: `Lead score increased from ${previousScore} to ${leadScore.overallScore}`,
      });
    }

    // Hot lead alert
    if (leadScore.overallScore >= 80 && previousScore < 80) {
      alerts.push({
        type: 'became_hot_lead',
        message: 'Contact has become a hot lead!',
      });
    }

    // High intent alert
    if (leadScore.scoreBreakdown.intentScore >= 70) {
      alerts.push({
        type: 'high_intent_detected',
        message: 'High purchase intent detected',
      });
    }

    // Add alerts to lead score
    leadScore.alerts.push(...alerts.map(alert => ({
      ...alert,
      triggeredAt: new Date(),
      acknowledged: false,
    })));

    console.log(`🚨 Generated ${alerts.length} alerts for lead`);

  } catch (error) {
    console.error('❌ Error checking for alerts:', error);
  }
};
