import mongoose from 'mongoose';

const leadScoreSchema = new mongoose.Schema({
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
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  scoreBreakdown: {
    engagementScore: { type: Number, min: 0, max: 100, default: 0 },
    demographicScore: { type: Number, min: 0, max: 100, default: 0 },
    behavioralScore: { type: Number, min: 0, max: 100, default: 0 },
    intentScore: { type: Number, min: 0, max: 100, default: 0 },
    firmographicScore: { type: Number, min: 0, max: 100, default: 0 },
  },
  scoringFactors: {
    emailOpens: { count: { type: Number, default: 0 }, weight: { type: Number, default: 0.2 } },
    emailClicks: { count: { type: Number, default: 0 }, weight: { type: Number, default: 0.3 } },
    websiteVisits: { count: { type: Number, default: 0 }, weight: { type: Number, default: 0.25 } },
    contentDownloads: { count: { type: Number, default: 0 }, weight: { type: Number, default: 0.15 } },
    socialEngagement: { count: { type: Number, default: 0 }, weight: { type: Number, default: 0.1 } },
    replyCount: { count: { type: Number, default: 0 }, weight: { type: Number, default: 0.4 } },
    meetingRequests: { count: { type: Number, default: 0 }, weight: { type: Number, default: 0.5 } },
  },
  leadGrade: {
    type: String,
    enum: ['A+', 'A', 'B', 'C', 'D', 'F'],
    required: true,
  },
  leadStatus: {
    type: String,
    enum: ['hot', 'warm', 'cold', 'qualified', 'nurturing', 'disqualified'],
    default: 'cold',
  },
  conversionProbability: {
    type: Number,
    min: 0,
    max: 1,
    required: true,
  },
  predictedValue: {
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    confidence: { type: Number, min: 0, max: 1, default: 0.5 },
  },
  scoringMetadata: {
    lastCalculated: { type: Date, default: Date.now },
    dataPoints: { type: Number, default: 0 },
    modelVersion: { type: String, default: '1.0' },
    confidence: { type: Number, min: 0, max: 1, default: 0.5 },
  },
  alerts: [{
    type: {
      type: String,
      enum: ['score_increased', 'became_hot_lead', 'high_intent_detected', 'engagement_spike'],
    },
    message: String,
    triggeredAt: { type: Date, default: Date.now },
    acknowledged: { type: Boolean, default: false },
  }],
  recommendations: [{
    type: {
      type: String,
      enum: ['send_personalized_email', 'schedule_call', 'send_proposal', 'invite_to_webinar', 'share_case_study', 'follow_up'],
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      required: true,
    },
    description: String,
    suggestedAction: String,
    createdAt: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

// Indexes
leadScoreSchema.index({ userId: 1, overallScore: -1 });
leadScoreSchema.index({ userId: 1, leadGrade: 1 });
leadScoreSchema.index({ userId: 1, leadStatus: 1 });
leadScoreSchema.index({ userId: 1, 'scoringMetadata.lastCalculated': -1 });

// Virtual for lead quality
leadScoreSchema.virtual('leadQuality').get(function() {
  if (this.overallScore >= 80) return 'excellent';
  if (this.overallScore >= 60) return 'good';
  if (this.overallScore >= 40) return 'fair';
  return 'poor';
});

// Method to update score
leadScoreSchema.methods.updateScore = function(newData) {
  console.log('🔄 Updating lead score for contact:', this.contactId);

  // Update scoring factors
  Object.keys(newData).forEach(key => {
    if (this.scoringFactors[key]) {
      this.scoringFactors[key].count = newData[key];
    }
  });

  // Recalculate scores
  this.calculateScores();
  this.scoringMetadata.lastCalculated = new Date();
  this.scoringMetadata.dataPoints = Object.values(this.scoringFactors).reduce((sum, factor) => sum + factor.count, 0);

  console.log('✅ Lead score updated:', {
    contactId: this.contactId,
    newScore: this.overallScore,
    grade: this.leadGrade
  });

  return this.save();
};

// Method to calculate all scores
leadScoreSchema.methods.calculateScores = function() {
  // Engagement Score (40% of total)
  const engagementRaw = (
    this.scoringFactors.emailOpens.count * this.scoringFactors.emailOpens.weight +
    this.scoringFactors.emailClicks.count * this.scoringFactors.emailClicks.weight +
    this.scoringFactors.websiteVisits.count * this.scoringFactors.websiteVisits.weight +
    this.scoringFactors.contentDownloads.count * this.scoringFactors.contentDownloads.weight +
    this.scoringFactors.socialEngagement.count * this.scoringFactors.socialEngagement.weight
  );
  this.scoreBreakdown.engagementScore = Math.min(engagementRaw * 10, 100);

  // Intent Score (30% of total)
  const intentRaw = (
    this.scoringFactors.replyCount.count * this.scoringFactors.replyCount.weight +
    this.scoringFactors.meetingRequests.count * this.scoringFactors.meetingRequests.weight
  );
  this.scoreBreakdown.intentScore = Math.min(intentRaw * 20, 100);

  // Behavioral Score (20% of total) - based on recency and frequency
  // Simplified calculation
  this.scoreBreakdown.behavioralScore = Math.min(
    (this.scoringFactors.emailOpens.count + this.scoringFactors.emailClicks.count) * 2,
    100
  );

  // Demographic and Firmographic scores (10% each) - placeholder
  this.scoreBreakdown.demographicScore = 50; // Would be based on contact data
  this.scoreBreakdown.firmographicScore = 50; // Would be based on company data

  // Calculate overall score
  this.overallScore = Math.round(
    this.scoreBreakdown.engagementScore * 0.4 +
    this.scoreBreakdown.intentScore * 0.3 +
    this.scoreBreakdown.behavioralScore * 0.2 +
    this.scoreBreakdown.demographicScore * 0.05 +
    this.scoreBreakdown.firmographicScore * 0.05
  );

  // Determine grade
  this.leadGrade = this.getGradeFromScore(this.overallScore);

  // Determine status
  this.leadStatus = this.getStatusFromScore(this.overallScore);

  // Calculate conversion probability (simplified)
  this.conversionProbability = Math.min(this.overallScore / 100, 1);

  // Generate recommendations
  this.generateRecommendations();
};

// Helper method to get grade from score
leadScoreSchema.methods.getGradeFromScore = function(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  if (score >= 30) return 'D';
  return 'F';
};

// Helper method to get status from score
leadScoreSchema.methods.getStatusFromScore = function(score) {
  if (score >= 80) return 'hot';
  if (score >= 60) return 'warm';
  if (score >= 30) return 'qualified';
  return 'cold';
};

// Helper method to generate recommendations
leadScoreSchema.methods.generateRecommendations = function() {
  this.recommendations = [];

  if (this.overallScore >= 80) {
    this.recommendations.push({
      type: 'schedule_call',
      priority: 'high',
      description: 'High-scoring lead ready for immediate follow-up',
      suggestedAction: 'Schedule a sales call within 24 hours',
    });
  } else if (this.overallScore >= 60) {
    this.recommendations.push({
      type: 'send_personalized_email',
      priority: 'medium',
      description: 'Lead shows good engagement, send personalized content',
      suggestedAction: 'Send case study or product demo invitation',
    });
  } else if (this.scoringFactors.emailOpens.count > 0) {
    this.recommendations.push({
      type: 'follow_up',
      priority: 'low',
      description: 'Lead has opened emails but not engaged further',
      suggestedAction: 'Send nurturing content to maintain interest',
    });
  }
};

const LeadScore = mongoose.model('LeadScore', leadScoreSchema);

export default LeadScore;
