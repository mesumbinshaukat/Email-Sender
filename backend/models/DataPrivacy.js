import mongoose from 'mongoose';

const dataPrivacySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gdprCompliance: {
    dataProcessingAgreement: { type: Boolean, default: false },
    privacyPolicy: { type: String }, // URL or text
    cookiePolicy: { type: String },
    consentMechanism: {
      type: String,
      enum: ['explicit', 'implicit', 'granular'],
      default: 'explicit'
    },
    dataRetentionPolicy: {
      personalData: { type: Number, default: 2555 }, // days (7 years)
      emailData: { type: Number, default: 1095 }, // days (3 years)
      analyticsData: { type: Number, default: 730 } // days (2 years)
    }
  },
  dataRequests: [{
    requestId: { type: String, unique: true },
    type: {
      type: String,
      enum: ['access', 'rectification', 'erasure', 'portability', 'restriction', 'objection']
    },
    requester: {
      email: String,
      name: String,
      contactId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact'
      }
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'rejected'],
      default: 'pending'
    },
    requestedAt: { type: Date, default: Date.now },
    completedAt: Date,
    data: mongoose.Schema.Types.Mixed, // Data provided to user
    reason: String,
    verificationMethod: String
  }],
  dataMapping: {
    personalData: [{
      category: String,
      purpose: String,
      legalBasis: {
        type: String,
        enum: ['consent', 'contract', 'legitimate_interest', 'legal_obligation', 'public_interest', 'vital_interest']
      },
      retentionPeriod: Number,
      sharedWith: [String], // Third parties
      location: String // Data storage location
    }],
    dataSubjects: [{
      type: {
        type: String,
        enum: ['customers', 'prospects', 'employees', 'website_visitors']
      },
      count: Number,
      dataCategories: [String]
    }]
  },
  breachNotifications: [{
    incidentId: String,
    description: String,
    affectedData: [String],
    affectedUsers: Number,
    notifiedAt: Date,
    resolution: String,
    preventiveMeasures: [String]
  }],
  auditLog: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: { type: Date, default: Date.now },
    details: mongoose.Schema.Types.Mixed,
    ipAddress: String
  }],
  complianceScore: {
    overall: { type: Number, min: 0, max: 100, default: 0 },
    gdpr: { type: Number, min: 0, max: 100, default: 0 },
    ccpa: { type: Number, min: 0, max: 100, default: 0 },
    lastCalculated: Date
  },
  settings: {
    autoDeleteInactiveData: { type: Boolean, default: false },
    anonymizeAfterRetention: { type: Boolean, default: true },
    requireConsentForMarketing: { type: Boolean, default: true },
    dataExportFormat: {
      type: String,
      enum: ['json', 'csv', 'xml'],
      default: 'json'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt on save
dataPrivacySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const DataPrivacy = mongoose.model('DataPrivacy', dataPrivacySchema);

export default DataPrivacy;
