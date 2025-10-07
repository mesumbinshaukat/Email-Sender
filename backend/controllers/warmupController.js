import User from '../models/User.js';
import Email from '../models/Email.js';

// @desc    Get warmup status
// @route   GET /api/warmup/status
// @access  Private
export const getWarmupStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('warmupSettings');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Calculate progress
    const settings = user.warmupSettings;
    const progress = settings.currentVolume > 0 ?
      Math.min((settings.currentVolume / settings.targetVolume) * 100, 100) : 0;

    // Get today's sends
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysSends = await Email.countDocuments({
      userId: req.user._id,
      createdAt: { $gte: today, $lt: tomorrow },
    });

    res.json({
      success: true,
      data: {
        settings,
        progress,
        todaysSends,
        remainingToday: Math.max(0, settings.currentVolume - todaysSends),
        isComplete: settings.currentVolume >= settings.targetVolume,
      },
    });
  } catch (error) {
    console.error('Get warmup status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching warmup status',
      error: error.message,
    });
  }
};

// @desc    Start warmup
// @route   POST /api/warmup/start
// @access  Private
export const startWarmup = async (req, res) => {
  try {
    const { targetVolume = 100, dailyIncrease = 10 } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Initialize warmup settings
    user.warmupSettings = {
      isActive: true,
      currentVolume: 10, // Start with 10 emails/day
      targetVolume,
      dailyIncrease,
      currentDay: 1,
      startDate: new Date(),
      lastIncrease: new Date(),
      reputationScore: 50,
      alertsEnabled: true,
    };

    await user.save();

    res.json({
      success: true,
      message: 'Warmup started successfully',
      data: user.warmupSettings,
    });
  } catch (error) {
    console.error('Start warmup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting warmup',
      error: error.message,
    });
  }
};

// @desc    Get warmup recommendations
// @route   GET /api/warmup/recommendations
// @access  Private
export const getWarmupRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const settings = user.warmupSettings;

    // Calculate recommendations based on current status
    let recommendations = [];

    if (!settings.isActive) {
      recommendations.push({
        type: 'start',
        title: 'Start Email Warmup',
        description: 'Begin gradual volume increase to improve deliverability',
        action: 'Start Warmup',
      });
    } else {
      // Check if we need to increase volume
      const daysSinceLastIncrease = Math.floor(
        (new Date() - settings.lastIncrease) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastIncrease >= 1 && settings.currentVolume < settings.targetVolume) {
        recommendations.push({
          type: 'increase',
          title: 'Increase Daily Volume',
          description: `Ready to increase from ${settings.currentVolume} to ${Math.min(settings.currentVolume + settings.dailyIncrease, settings.targetVolume)} emails/day`,
          action: 'Increase Volume',
        });
      }

      // Check bounce rate
      const recentEmails = await Email.find({
        userId: req.user._id,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });

      const bounceRate = recentEmails.filter(email => email.status === 'failed').length / recentEmails.length;

      if (bounceRate > 0.05) { // >5% bounce rate
        recommendations.push({
          type: 'bounce_alert',
          title: 'High Bounce Rate Detected',
          description: `Bounce rate is ${(bounceRate * 100).toFixed(1)}%. Consider cleaning your list.`,
          action: 'View Bounces',
          severity: 'high',
        });
      }

      // Reputation monitoring
      if (settings.reputationScore < 60) {
        recommendations.push({
          type: 'reputation',
          title: 'Improve Domain Reputation',
          description: 'Your reputation score is low. Focus on engagement and list quality.',
          action: 'View Tips',
          severity: 'medium',
        });
      }
    }

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('Get warmup recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations',
      error: error.message,
    });
  }
};

// @desc    Get reputation score
// @route   GET /api/warmup/reputation-score
// @access  Private
export const getReputationScore = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('warmupSettings');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Calculate reputation score based on various metrics
    const settings = user.warmupSettings;

    // Get recent email metrics (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentEmails = await Email.find({
      userId: req.user._id,
      createdAt: { $gte: thirtyDaysAgo }
    });

    if (recentEmails.length === 0) {
      return res.json({
        success: true,
        data: {
          score: settings.reputationScore,
          breakdown: {
            volume: 0,
            engagement: 0,
            bounces: 0,
            complaints: 0,
          },
          grade: 'Not enough data',
        },
      });
    }

    // Calculate metrics
    const totalSent = recentEmails.length;
    const opens = recentEmails.filter(email => email.tracking.totalOpens > 0).length;
    const clicks = recentEmails.filter(email => email.tracking.totalClicks > 0).length;
    const bounces = recentEmails.filter(email => email.status === 'failed').length;

    // Reputation calculation (simplified)
    const volumeScore = Math.min(totalSent / 50, 1) * 25; // Up to 25 points for volume
    const engagementScore = (opens / totalSent) * 35; // Up to 35 points for open rate
    const clickScore = (clicks / totalSent) * 25; // Up to 25 points for click rate
    const bouncePenalty = Math.max(0, 1 - (bounces / totalSent) * 10) * 15; // Up to 15 points penalty for bounces

    const totalScore = volumeScore + engagementScore + clickScore + bouncePenalty;

    // Grade calculation
    let grade;
    if (totalScore >= 80) grade = 'Excellent';
    else if (totalScore >= 70) grade = 'Good';
    else if (totalScore >= 60) grade = 'Fair';
    else if (totalScore >= 50) grade = 'Poor';
    else grade = 'Very Poor';

    res.json({
      success: true,
      data: {
        score: Math.round(totalScore),
        breakdown: {
          volume: Math.round(volumeScore),
          engagement: Math.round(engagementScore),
          clicks: Math.round(clickScore),
          bounces: Math.round(bouncePenalty),
        },
        grade,
        metrics: {
          totalSent,
          openRate: totalSent > 0 ? Math.round((opens / totalSent) * 100) : 0,
          clickRate: totalSent > 0 ? Math.round((clicks / totalSent) * 100) : 0,
          bounceRate: totalSent > 0 ? Math.round((bounces / totalSent) * 100) : 0,
        },
      },
    });
  } catch (error) {
    console.error('Get reputation score error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating reputation score',
      error: error.message,
    });
  }
};
