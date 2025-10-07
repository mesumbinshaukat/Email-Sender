import HeatmapAnalytics from '../models/HeatmapAnalytics.js';
import Email from '../models/Email.js';

// @desc    Track click heatmap data
// @route   POST /api/analytics/click
// @access  Public (via tracking pixel)
export const trackClick = async (req, res) => {
  try {
    const { sessionId, x, y, element, url, emailId, userAgent, screenWidth, screenHeight, viewportWidth, viewportHeight } = req.body;

    // Find or create heatmap analytics record
    let analytics = await HeatmapAnalytics.findOne({ sessionId });

    if (!analytics) {
      // Get email info
      const email = await Email.findById(emailId);
      if (!email) {
        return res.status(404).json({ success: false, message: 'Email not found' });
      }

      analytics = await HeatmapAnalytics.create({
        emailId,
        userId: email.userId,
        recipientEmail: email.to.join(', '),
        sessionId,
        deviceInfo: {
          userAgent,
          screenWidth: parseInt(screenWidth),
          screenHeight: parseInt(screenHeight),
          viewportWidth: parseInt(viewportWidth),
          viewportHeight: parseInt(viewportHeight),
          deviceType: getDeviceType(userAgent),
          browser: getBrowser(userAgent),
          os: getOS(userAgent),
        },
        openedAt: new Date(),
      });
    }

    // Add click data
    analytics.clicks.push({
      x: parseFloat(x),
      y: parseFloat(y),
      element,
      url,
      timestamp: new Date(),
    });

    // Update engagement metrics
    analytics.engagement.totalClicks = analytics.clicks.length;
    analytics.engagement.uniqueClicks = new Set(analytics.clicks.map(c => c.url)).size;
    analytics.lastActivity = new Date();

    await analytics.save();

    res.json({ success: true, message: 'Click tracked successfully' });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking click',
      error: error.message,
    });
  }
};

// @desc    Track scroll depth data
// @route   POST /api/analytics/scroll
// @access  Public (via tracking pixel)
export const trackScroll = async (req, res) => {
  try {
    const { sessionId, depth, timeSpent } = req.body;

    const analytics = await HeatmapAnalytics.findOne({ sessionId });
    if (!analytics) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Add scroll data
    analytics.scrolls.push({
      depth: parseFloat(depth),
      timeSpent: parseFloat(timeSpent) || 0,
      timestamp: new Date(),
    });

    // Update scroll metrics
    const maxDepth = Math.max(...analytics.scrolls.map(s => s.depth));
    const avgDepth = analytics.scrolls.reduce((sum, s) => sum + s.depth, 0) / analytics.scrolls.length;

    analytics.engagement.maxScrollDepth = maxDepth;
    analytics.engagement.averageScrollDepth = avgDepth;
    analytics.lastActivity = new Date();

    await analytics.save();

    res.json({ success: true, message: 'Scroll tracked successfully' });
  } catch (error) {
    console.error('Track scroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking scroll',
      error: error.message,
    });
  }
};

// @desc    Track time spent reading
// @route   POST /api/analytics/time
// @access  Public (via tracking pixel)
export const trackTime = async (req, res) => {
  try {
    const { sessionId, totalTime, activeTime, scrollTime, focusTime, startTime, endTime } = req.body;

    const analytics = await HeatmapAnalytics.findOne({ sessionId });
    if (!analytics) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Add time tracking data
    analytics.timeTracking.push({
      totalTime: parseFloat(totalTime),
      activeTime: parseFloat(activeTime) || 0,
      scrollTime: parseFloat(scrollTime) || 0,
      focusTime: parseFloat(focusTime) || 0,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    });

    // Update time metrics
    const totalTimeSpent = analytics.timeTracking.reduce((sum, t) => sum + t.totalTime, 0);
    const avgSessionTime = totalTimeSpent / analytics.timeTracking.length;

    analytics.engagement.totalTimeSpent = totalTimeSpent;
    analytics.engagement.averageSessionTime = avgSessionTime;
    analytics.lastActivity = new Date();

    // Calculate engagement score
    analytics.calculateEngagementScore();

    await analytics.save();

    res.json({ success: true, message: 'Time tracked successfully' });
  } catch (error) {
    console.error('Track time error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking time',
      error: error.message,
    });
  }
};

// @desc    Track geographic/location data
// @route   POST /api/analytics/geographic
// @access  Public (via tracking pixel)
export const trackGeographic = async (req, res) => {
  try {
    const { sessionId, country, region, city, latitude, longitude, timezone, ip } = req.body;

    const analytics = await HeatmapAnalytics.findOne({ sessionId });
    if (!analytics) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Update geographic data
    analytics.geographic = {
      country,
      region,
      city,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timezone,
      ip,
    };

    await analytics.save();

    res.json({ success: true, message: 'Geographic data tracked successfully' });
  } catch (error) {
    console.error('Track geographic error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking geographic data',
      error: error.message,
    });
  }
};

// @desc    Get heatmap data for email
// @route   GET /api/analytics/heatmap/:emailId
// @access  Private
export const getHeatmapData = async (req, res) => {
  try {
    const analytics = await HeatmapAnalytics.find({
      emailId: req.params.emailId,
      userId: req.user._id,
    }).sort({ openedAt: -1 });

    if (!analytics || analytics.length === 0) {
      return res.json({
        success: true,
        data: {
          clicks: [],
          scrolls: [],
          timeTracking: [],
          geographic: [],
          engagement: {
            totalClicks: 0,
            uniqueClicks: 0,
            maxScrollDepth: 0,
            averageScrollDepth: 0,
            totalTimeSpent: 0,
            averageSessionTime: 0,
            engagementScore: 0,
          },
        },
      });
    }

    // Aggregate data from all sessions
    const aggregated = {
      clicks: analytics.flatMap(a => a.clicks),
      scrolls: analytics.flatMap(a => a.scrolls),
      timeTracking: analytics.flatMap(a => a.timeTracking),
      geographic: analytics.map(a => a.geographic).filter(g => g),
      engagement: {
        totalClicks: analytics.reduce((sum, a) => sum + a.engagement.totalClicks, 0),
        uniqueClicks: analytics.reduce((sum, a) => sum + a.engagement.uniqueClicks, 0),
        maxScrollDepth: Math.max(...analytics.map(a => a.engagement.maxScrollDepth)),
        averageScrollDepth: analytics.reduce((sum, a) => sum + a.engagement.averageScrollDepth, 0) / analytics.length,
        totalTimeSpent: analytics.reduce((sum, a) => sum + a.engagement.totalTimeSpent, 0),
        averageSessionTime: analytics.reduce((sum, a) => sum + a.engagement.averageSessionTime, 0) / analytics.length,
        engagementScore: analytics.reduce((sum, a) => sum + a.engagement.engagementScore, 0) / analytics.length,
      },
    };

    res.json({
      success: true,
      data: aggregated,
      sessionCount: analytics.length,
    });
  } catch (error) {
    console.error('Get heatmap data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching heatmap data',
      error: error.message,
    });
  }
};

// @desc    Get scroll depth analytics
// @route   GET /api/analytics/scroll-depth/:emailId
// @access  Private
export const getScrollDepthData = async (req, res) => {
  try {
    const analytics = await HeatmapAnalytics.find({
      emailId: req.params.emailId,
      userId: req.user._id,
    });

    // Group scroll data by depth ranges
    const scrollBuckets = {};
    analytics.forEach(a => {
      a.scrolls.forEach(scroll => {
        const bucket = Math.floor(scroll.depth / 10) * 10; // Group by 10% increments
        if (!scrollBuckets[bucket]) {
          scrollBuckets[bucket] = { count: 0, totalTime: 0 };
        }
        scrollBuckets[bucket].count++;
        scrollBuckets[bucket].totalTime += scroll.timeSpent || 0;
      });
    });

    const scrollData = Object.entries(scrollBuckets).map(([depth, data]) => ({
      depth: parseInt(depth),
      count: data.count,
      averageTime: data.totalTime / data.count,
    })).sort((a, b) => a.depth - b.depth);

    res.json({
      success: true,
      data: scrollData,
    });
  } catch (error) {
    console.error('Get scroll depth data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching scroll depth data',
      error: error.message,
    });
  }
};

// @desc    Get time spent analytics
// @route   GET /api/analytics/time-spent/:emailId
// @access  Private
export const getTimeSpentData = async (req, res) => {
  try {
    const analytics = await HeatmapAnalytics.find({
      emailId: req.params.emailId,
      userId: req.user._id,
    });

    // Group time data by duration ranges
    const timeBuckets = {};
    analytics.forEach(a => {
      a.timeTracking.forEach(time => {
        const bucket = Math.floor(time.totalTime / 30) * 30; // Group by 30-second increments
        if (!timeBuckets[bucket]) {
          timeBuckets[bucket] = { count: 0, totalTime: 0 };
        }
        timeBuckets[bucket].count++;
        timeBuckets[bucket].totalTime += time.totalTime;
      });
    });

    const timeData = Object.entries(timeBuckets).map(([duration, data]) => ({
      duration: parseInt(duration),
      count: data.count,
      averageTime: data.totalTime / data.count,
    })).sort((a, b) => a.duration - b.duration);

    res.json({
      success: true,
      data: timeData,
    });
  } catch (error) {
    console.error('Get time spent data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching time spent data',
      error: error.message,
    });
  }
};

// @desc    Get device breakdown analytics
// @route   GET /api/analytics/device-breakdown
// @access  Private
export const getDeviceBreakdown = async (req, res) => {
  try {
    const deviceStats = await HeatmapAnalytics.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$deviceInfo.deviceType',
          count: { $sum: 1 },
          totalTime: { $sum: '$engagement.totalTimeSpent' },
          totalClicks: { $sum: '$engagement.totalClicks' },
        }
      }
    ]);

    const formatted = deviceStats.map(stat => ({
      device: stat._id || 'unknown',
      count: stat.count,
      averageTime: stat.totalTime / stat.count,
      averageClicks: stat.totalClicks / stat.count,
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('Get device breakdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching device breakdown',
      error: error.message,
    });
  }
};

// @desc    Get geographic engagement map
// @route   GET /api/analytics/geographic-map
// @access  Private
export const getGeographicMap = async (req, res) => {
  try {
    const geoStats = await HeatmapAnalytics.aggregate([
      { $match: { userId: req.user._id, 'geographic.country': { $exists: true } } },
      {
        $group: {
          _id: {
            country: '$geographic.country',
            region: '$geographic.region',
            city: '$geographic.city',
          },
          count: { $sum: 1 },
          latitude: { $first: '$geographic.latitude' },
          longitude: { $first: '$geographic.longitude' },
          totalTime: { $sum: '$engagement.totalTimeSpent' },
          totalClicks: { $sum: '$engagement.totalClicks' },
        }
      }
    ]);

    const formatted = geoStats.map(stat => ({
      country: stat._id.country,
      region: stat._id.region,
      city: stat._id.city,
      count: stat.count,
      latitude: stat.latitude,
      longitude: stat.longitude,
      averageTime: stat.totalTime / stat.count,
      averageClicks: stat.totalClicks / stat.count,
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('Get geographic map error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching geographic map',
      error: error.message,
    });
  }
};

// Helper functions for device detection
const getDeviceType = (userAgent) => {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
};

const getBrowser = (userAgent) => {
  if (/chrome/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent)) return 'Safari';
  if (/edge/i.test(userAgent)) return 'Edge';
  return 'Unknown';
};

const getOS = (userAgent) => {
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/mac/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/ios/i.test(userAgent)) return 'iOS';
  return 'Unknown';
};
