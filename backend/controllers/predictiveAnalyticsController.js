// express-async-handler removed - using native async/await
import Email from '../models/Email.js';
import User from '../models/User.js';

// @desc    Get forecast data
// @route   GET /api/analytics/forecast
// @access  Private
const getForecast = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get historical data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const emails = await Email.find({
    user: userId,
    createdAt: { $gte: thirtyDaysAgo }
  }).sort({ createdAt: 1   } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

  // Simple forecasting algorithm (linear regression)
  const dataPoints = emails.length;
  const opens = emails.filter(e => e.openedAt).length;
  const clicks = emails.filter(e => e.clickedAt).length;

  // Forecast next 30 days (simplified)
  const forecast = [];
  for (let i = 1; i <= 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    forecast.push({
      date: date.toISOString().split('T')[0],
      predictedOpens: Math.round((opens / dataPoints) * (1 + i * 0.02)), // 2% daily growth
      predictedClicks: Math.round((clicks / dataPoints) * (1 + i * 0.015)) // 1.5% daily growth
    });
  }

  res.json({
    historical: {
      totalEmails: dataPoints,
      totalOpens: opens,
      totalClicks: clicks,
      openRate: dataPoints > 0 ? (opens / dataPoints * 100).toFixed(2) : 0,
      clickRate: dataPoints > 0 ? (clicks / dataPoints * 100).toFixed(2) : 0
    },
    forecast
  });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get trends analysis
// @route   GET /api/analytics/trends
// @access  Private
const getTrends = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get data for last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const emails = await Email.find({
    user: userId,
    createdAt: { $gte: ninetyDaysAgo }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

  // Group by week
  const weeklyData = {};
  emails.forEach(email => {
    const week = new Date(email.createdAt);
    week.setDate(week.getDate() - week.getDay()); // Start of week
    const weekKey = week.toISOString().split('T')[0];

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { sent: 0, opened: 0, clicked: 0 };
    }

    weeklyData[weekKey].sent++;
    if (email.openedAt) weeklyData[weekKey].opened++;
    if (email.clickedAt) weeklyData[weekKey].clicked++;
  });

  const trends = Object.keys(weeklyData)
    .sort()
    .map(week => ({
      week,
      ...weeklyData[week],
      openRate: weeklyData[week].sent > 0 ? (weeklyData[week].opened / weeklyData[week].sent * 100).toFixed(2) : 0,
      clickRate: weeklyData[week].sent > 0 ? (weeklyData[week].clicked / weeklyData[week].sent * 100).toFixed(2) : 0
    }));

  // Calculate trend direction
  const recent = trends.slice(-4);
  const avgOpenRate = recent.reduce((sum, t) => sum + parseFloat(t.openRate), 0) / recent.length;
  const firstHalf = recent.slice(0, 2);
  const secondHalf = recent.slice(2);
  const firstAvg = firstHalf.reduce((sum, t) => sum + parseFloat(t.openRate), 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, t) => sum + parseFloat(t.openRate), 0) / secondHalf.length;

  const trend = secondAvg > firstAvg ? 'upward' : secondAvg < firstAvg ? 'downward' : 'stable';

  res.json({ trends, overallTrend: trend });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get anomaly detection
// @route   GET /api/analytics/anomalies
// @access  Private
const getAnomalies = async (req, res) => {
  try {
    const userId = req.user._id;

    // Simple anomaly detection based on standard deviation
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const emails = await Email.find({
    user: userId,
    createdAt: { $gte: sevenDaysAgo }
    });

    const dailyStats = {};
    emails.forEach(email => {
    const day = email.createdAt.toISOString().split('T')[0];
    if (!dailyStats[day]) {
      dailyStats[day] = { sent: 0, opened: 0, bounced: 0 };
    }
    dailyStats[day].sent++;
    if (email.openedAt) dailyStats[day].opened++;
    if (email.bouncedAt) dailyStats[day].bounced++;
    });

    const days = Object.keys(dailyStats);
    const sentValues = days.map(day => dailyStats[day].sent);
    const openValues = days.map(day => dailyStats[day].opened);

    // Calculate mean and standard deviation
    const sentMean = sentValues.reduce((a, b) => a + b, 0) / sentValues.length;
    const sentStd = Math.sqrt(sentValues.reduce((sum, val) => sum + Math.pow(val - sentMean, 2), 0) / sentValues.length);

    const anomalies = days
    .map((day, index) => ({
      day,
      sent: sentValues[index],
      deviation: Math.abs(sentValues[index] - sentMean) / sentStd
    }))
    .filter(item => item.deviation > 2) // 2 standard deviations
    .map(item => ({ ...item, type: item.sent > sentMean ? 'spike' : 'drop' }));

    res.json({
    anomalies,
    threshold: 2,
    message: anomalies.length > 0
      ? `${anomalies.length} anomalous days detected`
      : 'No significant anomalies detected'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get churn prediction
// @route   GET /api/analytics/churn-prediction
// @access  Private
const getChurnPrediction = async (req, res) => {
  try {
    const userId = req.user._id;

    // Simple churn prediction based on engagement patterns
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentEmails = await Email.find({
    user: userId,
    createdAt: { $gte: thirtyDaysAgo }
    });

    const olderEmails = await Email.find({
    user: userId,
    createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });

    const recentEngagement = recentEmails.filter(e => e.openedAt || e.clickedAt).length / recentEmails.length;
    const olderEngagement = olderEmails.filter(e => e.openedAt || e.clickedAt).length / olderEmails.length;

    const churnRisk = recentEngagement < olderEngagement * 0.7 ? 'high' : recentEngagement < olderEngagement * 0.9 ? 'medium' : 'low';

    res.json({
    churnRisk,
    recentEngagement: (recentEngagement * 100).toFixed(2),
    olderEngagement: (olderEngagement * 100).toFixed(2),
    recommendations: churnRisk === 'high'
      ? ['Send re-engagement campaign', 'Offer incentives', 'Review content strategy']
      : churnRisk === 'medium'
      ? ['Monitor closely', 'Send targeted content']
      : ['Maintain current strategy']
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get growth projection
// @route   GET /api/analytics/growth-projection
// @access  Private
const getGrowthProjection = async (req, res) => {
  try {
    const userId = req.user._id;

    // Simple growth projection based on current trends
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const emails = await Email.find({
    user: userId,
    createdAt: { $gte: ninetyDaysAgo }
    });

    const weeklyStats = {};
    emails.forEach(email => {
    const week = Math.floor((new Date() - new Date(email.createdAt)) / (7 * 24 * 60 * 60 * 1000));
    if (!weeklyStats[week]) weeklyStats[week] = { sent: 0, opened: 0 };
    weeklyStats[week].sent++;
    if (email.openedAt) weeklyStats[week].opened++;
    });

    const weeks = Object.keys(weeklyStats).sort((a, b) => parseInt(b) - parseInt(a));
    const recentWeeks = weeks.slice(0, 4);
    const avgSent = recentWeeks.reduce((sum, week) => sum + weeklyStats[week].sent, 0) / recentWeeks.length;
    const avgOpens = recentWeeks.reduce((sum, week) => sum + weeklyStats[week].opened, 0) / recentWeeks.length;

    // Project growth
    const projections = [];
    for (let i = 1; i <= 12; i++) {
    projections.push({
      month: i,
      projectedSent: Math.round(avgSent * Math.pow(1.05, i)), // 5% monthly growth
      projectedOpens: Math.round(avgOpens * Math.pow(1.08, i)) // 8% monthly growth
    });
    }

    res.json({
    current: {
      avgWeeklySent: Math.round(avgSent),
      avgWeeklyOpens: Math.round(avgOpens),
      openRate: (avgOpens / avgSent * 100).toFixed(2)
    },
    projections
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export {
  getForecast,
  getTrends,
  getAnomalies,
  getChurnPrediction,
  getGrowthProjection
};
