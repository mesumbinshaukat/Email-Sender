import mongoose from 'mongoose';

const complianceCheckSchema = new mongoose.Schema({
  emailId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Email',
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
  },
  complianceType: {
    type: String,
    enum: ['gdpr', 'can_spam', 'casl', 'ccpa', 'general'],
    required: true,
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  violations: [{
    rule: {
      type: String,
      enum: ['missing_unsubscribe', 'missing_physical_address', 'missing_privacy_policy', 'deceptive_subject', 'commercial_content', 'personal_data_collection', 'consent_missing', 'data_retention', 'transparency_lack'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    description: String,
    location: String,
    suggestion: String,
    wcagGuideline: String,
  }],
  recommendations: [{
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      required: true,
    },
    action: String,
    description: String,
    implementation: String,
    deadline: Date,
  }],
  generatedPolicies: {
    privacyPolicy: String,
    termsOfService: String,
    cookiePolicy: String,
    dataProcessingAgreement: String,
  },
  consentRecords: [{
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    consentType: {
      type: String,
      enum: ['marketing_emails', 'data_processing', 'profiling', 'third_party_sharing'],
    },
    consentGiven: { type: Boolean, default: false },
    consentDate: Date,
    consentExpiry: Date,
    consentMethod: {
      type: String,
      enum: ['checkbox', 'double_opt_in', 'verbal', 'written'],
    },
    ipAddress: String,
    userAgent: String,
  }],
  auditTrail: [{
    action: {
      type: String,
      enum: ['check_performed', 'policy_generated', 'consent_recorded', 'violation_fixed'],
    },
    timestamp: { type: Date, default: Date.now },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    details: String,
    ipAddress: String,
  }],
  complianceStatus: {
    type: String,
    enum: ['compliant', 'warning', 'non_compliant', 'under_review'],
    default: 'under_review',
  },
  nextReviewDate: Date,
  jurisdiction: {
    type: String,
    enum: ['us', 'eu', 'ca', 'uk', 'au', 'global'],
    default: 'global',
  },
}, {
  timestamps: true,
});

// Indexes
complianceCheckSchema.index({ userId: 1, complianceType: 1 });
complianceCheckSchema.index({ userId: 1, createdAt: -1 });
complianceCheckSchema.index({ complianceStatus: 1 });
complianceCheckSchema.index({ nextReviewDate: 1 });

const ComplianceCheck = mongoose.model('ComplianceCheck', complianceCheckSchema);

export default ComplianceCheck;
