import mongoose from 'mongoose';

const ecommerceIntegrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['shopify', 'woocommerce', 'bigcommerce', 'magento', 'ecwid'],
    required: true
  },
  storeName: String,
  credentials: {
    apiKey: String,
    apiSecret: String,
    accessToken: String,
    storeUrl: String,
    webhookSecret: String
  },
  settings: {
    syncOrders: { type: Boolean, default: true },
    syncProducts: { type: Boolean, default: true },
    syncCustomers: { type: Boolean, default: true },
    abandonedCartEmails: { type: Boolean, default: true },
    orderConfirmationEmails: { type: Boolean, default: true }
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'error', 'syncing'],
    default: 'disconnected'
  },
  lastSync: Date,
  webhooks: [{
    event: String,
    url: String,
    active: { type: Boolean, default: true }
  }],
  syncStats: {
    ordersSynced: { type: Number, default: 0 },
    productsSynced: { type: Number, default: 0 },
    customersSynced: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

const EcommerceIntegration = mongoose.model('EcommerceIntegration', ecommerceIntegrationSchema);

export default EcommerceIntegration;
