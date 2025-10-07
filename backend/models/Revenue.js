import mongoose from 'mongoose';

const conversionEventSchema = new mongoose.Schema({
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
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    index: true,
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    index: true,
  },
  conversionType: {
    type: String,
    enum: ['purchase', 'signup', 'download', 'meeting_booked', 'demo_requested', 'trial_started', 'custom'],
    required: true,
  },
  revenue: {
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
  },
  value: {
    type: Number,
    default: 0, // For non-monetary conversions (e.g., lead score)
  },
  attribution: {
    touchpoints: [{
      emailId: { type: mongoose.Schema.Types.ObjectId, ref: 'Email' },
      timestamp: Date,
      interactionType: { type: String, enum: ['open', 'click', 'reply'] },
      weight: { type: Number, min: 0, max: 1 }, // Attribution weight
    }],
    model: {
      type: String,
      enum: ['first_touch', 'last_touch', 'linear', 'time_decay', 'position_based'],
      default: 'last_touch',
    },
    confidence: { type: Number, min: 0, max: 1 },
  },
  source: {
    type: String,
    enum: ['webhook', 'api', 'manual', 'integration'],
    default: 'manual',
  },
  externalId: String, // Reference to external system (e.g., order ID)
  metadata: {
    customerEmail: String,
    customerName: String,
    productId: String,
    productName: String,
    quantity: Number,
    unitPrice: Number,
    discountAmount: Number,
    taxAmount: Number,
    shippingAmount: Number,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    referrer: String,
  },
  occurredAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes for performance
conversionEventSchema.index({ userId: 1, occurredAt: -1 });
conversionEventSchema.index({ conversionType: 1 });
conversionEventSchema.index({ 'revenue.amount': -1 });
conversionEventSchema.index({ 'attribution.touchpoints.emailId': 1 });

const revenueGoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  targetRevenue: {
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    period: { type: String, enum: ['monthly', 'quarterly', 'yearly'], default: 'monthly' },
  },
  conversionTypes: [{
    type: String,
    enum: ['purchase', 'signup', 'download', 'meeting_booked', 'demo_requested', 'trial_started', 'custom'],
  }],
  attributionModel: {
    type: String,
    enum: ['first_touch', 'last_touch', 'linear', 'time_decay', 'position_based'],
    default: 'last_touch',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
revenueGoalSchema.index({ userId: 1, isActive: 1 });

// Pre-save middleware to update timestamps
revenueGoalSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const ConversionEvent = mongoose.model('ConversionEvent', conversionEventSchema);
const RevenueGoal = mongoose.model('RevenueGoal', revenueGoalSchema);

export { ConversionEvent, RevenueGoal };
