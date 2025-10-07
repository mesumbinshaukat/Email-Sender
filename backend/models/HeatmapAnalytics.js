import mongoose from 'mongoose';

const clickDataSchema = new mongoose.Schema({
  x: { type: Number, required: true }, // X coordinate (percentage of viewport)
  y: { type: Number, required: true }, // Y coordinate (percentage of viewport)
  timestamp: { type: Date, default: Date.now },
  element: String, // CSS selector or element description
  url: String, // Link URL if clicked
});

const scrollDataSchema = new mongoose.Schema({
  depth: { type: Number, required: true }, // Scroll depth percentage (0-100)
  timestamp: { type: Date, default: Date.now },
  timeSpent: { type: Number }, // Time spent at this scroll depth
});

const timeDataSchema = new mongoose.Schema({
  totalTime: { type: Number, required: true }, // Total time spent reading (seconds)
  activeTime: { type: Number, default: 0 }, // Active reading time (seconds)
  scrollTime: { type: Number, default: 0 }, // Time spent scrolling
  focusTime: { type: Number, default: 0 }, // Time window was in focus
  startTime: { type: Date, required: true },
  endTime: { type: Date, default: Date.now },
});

const geographicDataSchema = new mongoose.Schema({
  country: String,
  region: String,
  city: String,
  latitude: Number,
  longitude: Number,
  timezone: String,
  ip: String,
});

const heatmapAnalyticsSchema = new mongoose.Schema({
  emailId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Email',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  recipientEmail: {
    type: String,
    required: true,
    index: true,
  },
  deviceInfo: {
    userAgent: String,
    screenWidth: Number,
    screenHeight: Number,
    viewportWidth: Number,
    viewportHeight: Number,
    deviceType: { type: String, enum: ['desktop', 'mobile', 'tablet'] },
    browser: String,
    os: String,
  },
  clicks: [clickDataSchema],
  scrolls: [scrollDataSchema],
  timeTracking: [timeDataSchema],
  geographic: geographicDataSchema,
  engagement: {
    totalClicks: { type: Number, default: 0 },
    uniqueClicks: { type: Number, default: 0 },
    maxScrollDepth: { type: Number, default: 0 },
    averageScrollDepth: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 }, // Total time across all sessions
    averageSessionTime: { type: Number, default: 0 },
    bounceRate: { type: Number, default: 0 }, // Percentage who didn't engage
    engagementScore: { type: Number, default: 0 }, // 0-100 engagement score
  },
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  openedAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

// Indexes for performance
heatmapAnalyticsSchema.index({ userId: 1, emailId: 1 });
heatmapAnalyticsSchema.index({ sessionId: 1 });
heatmapAnalyticsSchema.index({ 'geographic.country': 1 });
heatmapAnalyticsSchema.index({ openedAt: -1 });

// Virtual for total engagement time
heatmapAnalyticsSchema.virtual('totalEngagementTime').get(function() {
  return this.timeTracking.reduce((total, session) => total + session.totalTime, 0);
});

// Method to calculate engagement score
heatmapAnalyticsSchema.methods.calculateEngagementScore = function() {
  let score = 0;

  // Time spent (up to 40 points)
  const timeScore = Math.min(this.totalEngagementTime / 300, 1) * 40; // Max 40 points for 5+ minutes
  score += timeScore;

  // Scroll depth (up to 30 points)
  const scrollScore = (this.engagement.maxScrollDepth / 100) * 30;
  score += scrollScore;

  // Clicks (up to 20 points)
  const clickScore = Math.min(this.engagement.totalClicks * 2, 20);
  score += clickScore;

  // Multiple sessions bonus (up to 10 points)
  if (this.timeTracking.length > 1) {
    score += Math.min(this.timeTracking.length * 2, 10);
  }

  this.engagement.engagementScore = Math.round(Math.min(score, 100));
  return this.engagement.engagementScore;
};

const HeatmapAnalytics = mongoose.model('HeatmapAnalytics', heatmapAnalyticsSchema);

export default HeatmapAnalytics;
