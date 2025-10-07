import mongoose from 'mongoose';

const outreachSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  targetAudience: String,
  channels: [{ type: String, enum: ['email', 'linkedin', 'twitter', 'cold-call'] }],
  sequence: [{
    step: Number,
    channel: String,
    template: String,
    delayDays: Number,
    subject: String,
    content: String
  }],
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }],
  status: { type: String, enum: ['draft', 'active', 'paused', 'completed'], default: 'draft' },
  stats: {
    sent: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    replied: { type: Number, default: 0 },
    converted: { type: Number, default: 0 }
  },
  startDate: Date,
  endDate: Date
}, {
  timestamps: true
});

outreachSchema.index({ user: 1, status: 1 });

const Outreach = mongoose.model('Outreach', outreachSchema);

export default Outreach;
