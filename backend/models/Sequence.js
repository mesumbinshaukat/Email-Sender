import mongoose from 'mongoose';

const sequenceStepSchema = new mongoose.Schema({
  stepNumber: { type: Number, required: true },
  name: { type: String, required: true },
  subject: { type: String, required: true },
  content: { type: String, required: true },
  delayDays: { type: Number, default: 0 }, // Days to wait before sending this step
  delayHours: { type: Number, default: 0 }, // Hours to wait before sending this step
  conditions: [{
    type: { type: String, enum: ['opened', 'clicked', 'not_opened', 'not_clicked', 'replied'] },
    operator: { type: String, enum: ['and', 'or'], default: 'and' },
    value: mongoose.Schema.Types.Mixed // For custom conditions
  }],
  aiGenerated: { type: Boolean, default: false },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailTemplate' },
  sendTime: { type: String, enum: ['immediate', 'morning', 'afternoon', 'evening'], default: 'immediate' },
  status: { type: String, enum: ['draft', 'active', 'paused', 'completed'], default: 'draft' }
});

const sequenceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  steps: [sequenceStepSchema],
  targetContacts: [{ type: String }], // Email addresses
  tags: [{ type: String }],
  status: { type: String, enum: ['draft', 'active', 'paused', 'completed'], default: 'draft' },
  totalContacts: { type: Number, default: 0 },
  completedContacts: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  settings: {
    maxSteps: { type: Number, default: 10 },
    respectTimezone: { type: Boolean, default: true },
    skipWeekends: { type: Boolean, default: false },
    stopOnReply: { type: Boolean, default: true },
    stopOnUnsubscribe: { type: Boolean, default: true },
    aiOptimization: { type: Boolean, default: false }
  },
  analytics: {
    totalSent: { type: Number, default: 0 },
    totalOpens: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },
    totalReplies: { type: Number, default: 0 },
    totalUnsubscribes: { type: Number, default: 0 },
    averageReadTime: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamps
sequenceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for total steps
sequenceSchema.virtual('totalSteps').get(function() {
  return this.steps.length;
});

// Virtual for active contacts
sequenceSchema.virtual('activeContacts').get(function() {
  return this.totalContacts - this.completedContacts;
});

const Sequence = mongoose.model('Sequence', sequenceSchema);

export default Sequence;
