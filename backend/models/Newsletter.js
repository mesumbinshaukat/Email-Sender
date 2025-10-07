import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  subject: String,
  content: String,
  template: String,
  frequency: { type: String, enum: ['daily', 'weekly', 'biweekly', 'monthly'], default: 'weekly' },
  sendDay: String, // e.g., 'Monday', 'Tuesday'
  sendTime: String, // e.g., '09:00'
  subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }],
  status: { type: String, enum: ['draft', 'active', 'paused', 'archived'], default: 'draft' },
  stats: {
    totalSent: { type: Number, default: 0 },
    totalOpens: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },
    unsubscribes: { type: Number, default: 0 }
  },
  lastSentAt: Date,
  nextSendAt: Date
}, {
  timestamps: true
});

newsletterSchema.index({ user: 1, status: 1 });

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

export default Newsletter;
