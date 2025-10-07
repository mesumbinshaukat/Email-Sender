import mongoose from 'mongoose';

const replyAnalysisSchema = new mongoose.Schema({
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
  originalEmail: {
    subject: String,
    content: String,
    sentAt: Date,
  },
  replyContent: {
    type: String,
    required: true,
  },
  replyMetadata: {
    from: String,
    to: String,
    subject: String,
    receivedAt: Date,
    messageId: String,
  },
  analysis: {
    sentiment: {
      score: { type: Number, min: -1, max: 1 }, // -1 (negative) to 1 (positive)
      label: { type: String, enum: ['positive', 'neutral', 'negative'] },
      confidence: { type: Number, min: 0, max: 1 },
    },
    intent: {
      type: { type: String, enum: ['interested', 'not_interested', 'question', 'meeting_request', 'unsubscribe', 'complaint', 'positive_feedback', 'negative_feedback', 'neutral'] },
      confidence: { type: Number, min: 0, max: 1 },
    },
    urgency: {
      level: { type: String, enum: ['low', 'medium', 'high'] },
      score: { type: Number, min: 0, max: 1 },
    },
    topics: [{
      topic: String,
      relevance: { type: Number, min: 0, max: 1 },
      sentiment: { type: Number, min: -1, max: 1 },
    }],
    entities: [{
      type: { type: String, enum: ['person', 'organization', 'location', 'date', 'email', 'phone', 'url'] },
      value: String,
      confidence: { type: Number, min: 0, max: 1 },
    }],
  },
  actions: {
    autoCategorized: { type: Boolean, default: false },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    tags: [{ type: String }],
    followUpNeeded: { type: Boolean, default: false },
    followUpDate: Date,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  responseSuggestions: [{
    suggestion: String,
    confidence: { type: Number, min: 0, max: 1 },
    tone: { type: String, enum: ['professional', 'friendly', 'urgent', 'apologetic', 'enthusiastic'] },
    template: String,
    generatedAt: { type: Date, default: Date.now },
  }],
  status: {
    type: String,
    enum: ['unread', 'read', 'responded', 'archived', 'spam'],
    default: 'unread',
  },
  aiProcessed: { type: Boolean, default: false },
  processingError: String,
}, {
  timestamps: true,
});

// Indexes
replyAnalysisSchema.index({ userId: 1, createdAt: -1 });
replyAnalysisSchema.index({ 'analysis.intent.type': 1 });
replyAnalysisSchema.index({ 'actions.priority': 1 });
replyAnalysisSchema.index({ status: 1 });

// Virtual for hot lead score
replyAnalysisSchema.virtual('hotLeadScore').get(function() {
  let score = 0;

  // Positive sentiment and interest increases score
  if (this.analysis.sentiment.label === 'positive') score += 30;
  if (this.analysis.intent.type === 'interested') score += 40;
  if (this.analysis.intent.type === 'meeting_request') score += 50;

  // Urgency increases score
  if (this.analysis.urgency.level === 'high') score += 20;

  // Recent replies get higher scores
  const daysSinceReply = (new Date() - this.createdAt) / (1000 * 60 * 60 * 24);
  if (daysSinceReply < 1) score += 20;
  else if (daysSinceReply < 3) score += 10;

  return Math.min(score, 100);
});

// Method to get suggested response
replyAnalysisSchema.methods.getBestResponseSuggestion = function() {
  return this.responseSuggestions.sort((a, b) => b.confidence - a.confidence)[0];
};

const ReplyAnalysis = mongoose.model('ReplyAnalysis', replyAnalysisSchema);

export default ReplyAnalysis;
