import mongoose from 'mongoose';

const unsubscribeSignalSchema = new mongoose.Schema({
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  emailId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Email',
    index: true,
  },
  signalType: {
    type: String,
    enum: ['unsubscribe_click', 'complaint', 'bounce', 'low_engagement', 'negative_reply', 'frequency_complaint'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true,
  },
  detectedAt: {
    type: Date,
    default: Date.now,
  },
  description: String,
  metadata: {
    url: String, // For unsubscribe clicks
    bounceType: String, // For bounces
    complaintReason: String, // For complaints
    engagementScore: Number, // For low engagement
    replySentiment: Number, // For negative replies
  },
});

const retentionCampaignSchema = new mongoose.Schema({
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  triggerSignal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UnsubscribeSignal',
    required: true,
  },
  campaignType: {
    type: String,
    enum: ['win_back', 'frequency_adjustment', 'content_improvement', 'special_offer', 'survey'],
    required: true,
  },
  status: {
    type: String,
    enum: ['scheduled', 'sent', 'responded', 'successful', 'failed'],
    default: 'scheduled',
  },
  scheduledFor: Date,
  sentAt: Date,
  respondedAt: Date,
  content: {
    subject: String,
    body: String,
    offer: String,
    callToAction: String,
  },
  aiGenerated: { type: Boolean, default: false },
  effectiveness: {
    reopened: { type: Boolean, default: false },
    clicked: { type: Boolean, default: false },
    unsubscribed: { type: Boolean, default: false },
    score: { type: Number, min: 0, max: 100, default: 0 },
  },
}, {
  timestamps: true,
});

const preferenceCenterSchema = new mongoose.Schema({
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  preferences: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'never'],
      default: 'weekly',
    },
    contentTypes: [{
      type: String,
      enum: ['newsletters', 'product_updates', 'promotions', 'educational', 'events'],
    }],
    topics: [{
      topic: String,
      interest: { type: Number, min: 0, max: 5, default: 3 }, // 1-5 scale
    }],
    communicationChannels: [{
      type: String,
      enum: ['email', 'sms', 'push', 'none'],
    }],
  },
  unsubscribeReasons: [{
    reason: {
      type: String,
      enum: ['too_frequent', 'not_relevant', 'poor_quality', 'privacy_concerns', 'changed_mind', 'other'],
    },
    details: String,
    reportedAt: { type: Date, default: Date.now },
  }],
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  unsubscribeToken: {
    type: String,
    unique: true,
    sparse: true,
  },
}, {
  timestamps: true,
});

// Indexes
unsubscribeSignalSchema.index({ userId: 1, detectedAt: -1 });
unsubscribeSignalSchema.index({ contactId: 1, severity: 1 });
retentionCampaignSchema.index({ userId: 1, status: 1 });
retentionCampaignSchema.index({ scheduledFor: 1 });
preferenceCenterSchema.index({ userId: 1, 'preferences.frequency': 1 });

const UnsubscribeSignal = mongoose.model('UnsubscribeSignal', unsubscribeSignalSchema);
const RetentionCampaign = mongoose.model('RetentionCampaign', retentionCampaignSchema);
const PreferenceCenter = mongoose.model('PreferenceCenter', preferenceCenterSchema);

export { UnsubscribeSignal, RetentionCampaign, PreferenceCenter };
