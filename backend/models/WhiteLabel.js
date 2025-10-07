import mongoose from 'mongoose';

const whiteLabelSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  branding: {
    companyName: { type: String, required: true },
    logo: String, // URL to logo
    primaryColor: { type: String, default: '#3b82f6' },
    secondaryColor: { type: String, default: '#64748b' },
    fontFamily: { type: String, default: 'Inter' },
    customCSS: String
  },
  domain: {
    customDomain: String,
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    sslCertificate: String
  },
  emailSettings: {
    fromName: String,
    fromEmail: String,
    replyToEmail: String,
    smtpSettings: {
      host: String,
      port: Number,
      secure: Boolean,
      auth: {
        user: String,
        pass: String
      }
    }
  },
  features: {
    removeBranding: { type: Boolean, default: false },
    customIntegrations: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    whiteLabelSupport: { type: Boolean, default: false }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['starter', 'professional', 'enterprise', 'white_label'],
      default: 'white_label'
    },
    maxUsers: { type: Number, default: 10 },
    maxEmails: { type: Number, default: 100000 },
    features: [String]
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
whiteLabelSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const WhiteLabel = mongoose.model('WhiteLabel', whiteLabelSchema);

export default WhiteLabel;
