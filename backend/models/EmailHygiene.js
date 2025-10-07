import mongoose from 'mongoose';

const emailHygieneSchema = new mongoose.Schema({
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
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  hygieneStatus: {
    type: String,
    enum: ['clean', 'warning', 'risky', 'invalid', 'complainer'],
    default: 'clean',
  },
  validationResults: {
    syntax: {
      valid: { type: Boolean, default: true },
      reason: String,
    },
    mx: {
      valid: { type: Boolean, default: true },
      records: [String],
    },
    smtp: {
      valid: { type: Boolean, default: true },
      response: String,
    },
    disposable: {
      isDisposable: { type: Boolean, default: false },
      domain: String,
    },
    roleBased: {
      isRoleBased: { type: Boolean, default: false },
      role: String,
    },
    catchAll: {
      isCatchAll: { type: Boolean, default: false },
      confidence: { type: Number, min: 0, max: 1 },
    },
  },
  engagementMetrics: {
    totalSent: { type: Number, default: 0 },
    totalOpens: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },
    totalBounces: { type: Number, default: 0 },
    totalComplaints: { type: Number, default: 0 },
    lastEngaged: Date,
    engagementScore: { type: Number, min: 0, max: 100, default: 50 },
  },
  riskFactors: [{
    type: {
      type: String,
      enum: ['hard_bounce', 'soft_bounce', 'complaint', 'unsubscribe', 'spam_report', 'no_engagement', 'invalid_syntax', 'disposable_domain'],
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
    },
    detectedAt: { type: Date, default: Date.now },
    description: String,
  }],
  suppressionReason: {
    type: String,
    enum: ['hard_bounce', 'complaint', 'unsubscribe', 'manual_suppression', 'invalid_email'],
  },
  suppressionDate: Date,
  lastValidated: {
    type: Date,
    default: Date.now,
  },
  validationSource: {
    type: String,
    enum: ['api', 'manual', 'automated', 'import'],
    default: 'automated',
  },
}, {
  timestamps: true,
});

// Indexes
emailHygieneSchema.index({ userId: 1, hygieneStatus: 1 });
emailHygieneSchema.index({ userId: 1, lastValidated: -1 });
emailHygieneSchema.index({ email: 1 });
emailHygieneSchema.index({ 'engagementMetrics.engagementScore': -1 });

// Virtual for overall health score
emailHygieneSchema.virtual('healthScore').get(function() {
  let score = 100;

  // Deduct points for risk factors
  this.riskFactors.forEach(risk => {
    switch (risk.severity) {
      case 'critical': score -= 30; break;
      case 'high': score -= 20; break;
      case 'medium': score -= 10; break;
      case 'low': score -= 5; break;
    }
  });

  // Deduct for validation issues
  if (!this.validationResults.syntax.valid) score -= 25;
  if (!this.validationResults.mx.valid) score -= 20;
  if (!this.validationResults.smtp.valid) score -= 15;
  if (this.validationResults.disposable.isDisposable) score -= 30;
  if (this.validationResults.catchAll.isCatchAll) score -= 10;

  // Boost for good engagement
  if (this.engagementMetrics.engagementScore > 70) score += 10;
  if (this.engagementMetrics.totalOpens > 0) score += 5;

  return Math.max(0, Math.min(100, score));
});

// Method to update hygiene status
emailHygieneSchema.methods.updateHygieneStatus = function() {
  console.log('🔍 Updating hygiene status for email:', this.email);

  const healthScore = this.healthScore;

  if (this.suppressionReason) {
    this.hygieneStatus = 'invalid';
  } else if (this.riskFactors.some(r => r.severity === 'critical')) {
    this.hygieneStatus = 'invalid';
  } else if (this.riskFactors.some(r => r.severity === 'high') || healthScore < 30) {
    this.hygieneStatus = 'risky';
  } else if (this.riskFactors.some(r => r.severity === 'medium') || healthScore < 60) {
    this.hygieneStatus = 'warning';
  } else {
    this.hygieneStatus = 'clean';
  }

  console.log('✅ Hygiene status updated:', {
    email: this.email,
    status: this.hygieneStatus,
    healthScore
  });

  return this.save();
};

const EmailHygiene = mongoose.model('EmailHygiene', emailHygieneSchema);

export default EmailHygiene;
