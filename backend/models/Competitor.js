import mongoose from 'mongoose';

const competitorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  domain: {
    type: String,
    required: true,
    lowercase: true,
  },
  industry: String,
  description: String,
  website: String,
  socialMedia: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String,
  },
  emailPatterns: [String], // Common email patterns they use
  contentStrategy: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'irregular'],
    },
    topics: [String],
    tone: {
      type: String,
      enum: ['professional', 'casual', 'formal', 'friendly', 'aggressive'],
    },
    ctaTypes: [String],
  },
  performanceMetrics: {
    openRate: { type: Number, min: 0, max: 100 },
    clickRate: { type: Number, min: 0, max: 100 },
    unsubscribeRate: { type: Number, min: 0, max: 100 },
    lastAnalyzed: Date,
  },
  competitorEmails: [{
    subject: String,
    content: String,
    sentDate: Date,
    performance: {
      opens: Number,
      clicks: Number,
      unsubscribes: Number,
    },
    capturedAt: { type: Date, default: Date.now },
  }],
  insights: [{
    type: {
      type: String,
      enum: ['subject_line_trend', 'content_strategy', 'timing_pattern', 'engagement_tactic', 'design_element'],
    },
    title: String,
    description: String,
    impact: {
      type: String,
      enum: ['high', 'medium', 'low'],
    },
    actionable: { type: Boolean, default: true },
    discoveredAt: { type: Date, default: Date.now },
  }],
  monitoringSettings: {
    active: { type: Boolean, default: true },
    emailCapture: { type: Boolean, default: true },
    frequency: {
      type: String,
      enum: ['realtime', 'daily', 'weekly'],
      default: 'weekly',
    },
    alertThresholds: {
      openRateChange: { type: Number, default: 5 }, // % change that triggers alert
      newCampaign: { type: Boolean, default: true },
      strategyChange: { type: Boolean, default: true },
    },
  },
}, {
  timestamps: true,
});

// Indexes
competitorSchema.index({ userId: 1, domain: 1 }, { unique: true });
competitorSchema.index({ 'performanceMetrics.lastAnalyzed': -1 });

const industryBenchmarkSchema = new mongoose.Schema({
  industry: {
    type: String,
    required: true,
    unique: true,
  },
  metrics: {
    averageOpenRate: { type: Number, min: 0, max: 100 },
    averageClickRate: { type: Number, min: 0, max: 100 },
    averageUnsubscribeRate: { type: Number, min: 0, max: 100 },
    topSubjectKeywords: [String],
    optimalSendDays: [String], // e.g., ['monday', 'wednesday', 'friday']
    optimalSendTimes: [String], // e.g., ['09:00', '14:00', '16:00']
    contentLength: {
      average: Number,
      recommended: Number,
    },
    imageUsageRate: { type: Number, min: 0, max: 100 },
    personalizationRate: { type: Number, min: 0, max: 100 },
    mobileOptimizationRate: { type: Number, min: 0, max: 100 },
  },
  trends: [{
    period: String, // e.g., '2024-Q1'
    openRateChange: Number, // percentage change
    popularTopics: [String],
    emergingStrategies: [String],
  }],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
industryBenchmarkSchema.index({ industry: 1 });

const Competitor = mongoose.model('Competitor', competitorSchema);
const IndustryBenchmark = mongoose.model('IndustryBenchmark', industryBenchmarkSchema);

export { Competitor, IndustryBenchmark };
