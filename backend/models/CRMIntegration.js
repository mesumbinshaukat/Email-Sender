import mongoose from 'mongoose';

const crmIntegrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: String,
    enum: ['salesforce', 'hubspot', 'pipedrive', 'zoho', 'activecampaign'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  credentials: {
    apiKey: String,
    accessToken: String,
    refreshToken: String,
    clientId: String,
    clientSecret: String,
    domain: String // for Salesforce
  },
  settings: {
    syncContacts: { type: Boolean, default: true },
    syncDeals: { type: Boolean, default: true },
    syncEmails: { type: Boolean, default: false },
    syncDirection: {
      type: String,
      enum: ['one_way', 'two_way'],
      default: 'two_way'
    },
    fieldMappings: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'error', 'syncing'],
    default: 'disconnected'
  },
  lastSync: Date,
  errorMessage: String,
  syncStats: {
    contactsSynced: { type: Number, default: 0 },
    dealsSynced: { type: Number, default: 0 },
    emailsSynced: { type: Number, default: 0 },
    lastSyncDuration: Number
  }
}, {
  timestamps: true
});

const CRMIntegration = mongoose.model('CRMIntegration', crmIntegrationSchema);

export default CRMIntegration;
