import mongoose from 'mongoose';

const webhookSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true },
  url: { type: String, required: true },
  events: [{
    type: String,
    enum: ['email.sent', 'email.opened', 'email.clicked', 'email.bounced', 'contact.created', 'contact.updated', 'campaign.created', 'campaign.completed'],
    required: true
  }],
  secret: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  headers: mongoose.Schema.Types.Mixed, // Custom headers
  retryCount: { type: Number, default: 0 },
  lastTriggered: Date,
  deliveryStats: {
    success: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

webhookSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Webhook = mongoose.model('Webhook', webhookSchema);

export default Webhook;
