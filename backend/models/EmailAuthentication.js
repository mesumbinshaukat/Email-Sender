import mongoose from 'mongoose';

const emailAuthenticationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  domain: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'verifying', 'verified', 'failed'],
    default: 'pending'
  },
  spf: {
    record: String,
    verified: { type: Boolean, default: false },
    errors: [String]
  },
  dkim: {
    selector: String,
    publicKey: String,
    privateKey: String, // Encrypted
    verified: { type: Boolean, default: false },
    errors: [String]
  },
  dmarc: {
    record: String,
    policy: {
      type: String,
      enum: ['none', 'quarantine', 'reject'],
      default: 'none'
    },
    verified: { type: Boolean, default: false },
    errors: [String]
  },
  verificationResults: {
    spfCheck: Boolean,
    dkimCheck: Boolean,
    dmarcCheck: Boolean,
    overallScore: { type: Number, min: 0, max: 100 },
    lastChecked: Date
  },
  recommendations: [{
    type: {
      type: String,
      enum: ['spf_missing', 'dkim_missing', 'dmarc_missing', 'spf_incorrect', 'dkim_invalid', 'dmarc_weak']
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    message: String,
    solution: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'ignored'],
      default: 'pending'
    }
  }],
  verificationHistory: [{
    timestamp: Date,
    type: String,
    result: Boolean,
    details: String
  }],
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
emailAuthenticationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const EmailAuthentication = mongoose.model('EmailAuthentication', emailAuthenticationSchema);

export default EmailAuthentication;
