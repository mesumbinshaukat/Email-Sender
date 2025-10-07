import mongoose from 'mongoose';

const inboxRotationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    enum: ['gmail', 'outlook', 'yahoo', 'custom'],
    required: true
  },
  smtpHost: String,
  smtpPort: {
    type: Number,
    default: 587
  },
  imapHost: String,
  imapPort: {
    type: Number,
    default: 993
  },
  status: {
    type: String,
    enum: ['active', 'warming', 'cooldown', 'inactive'],
    default: 'inactive'
  },
  warmupLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  dailySendLimit: {
    type: Number,
    default: 50
  },
  currentDailySends: {
    type: Number,
    default: 0
  },
  lastSendDate: Date,
  reputationScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  rotationGroup: {
    type: String,
    default: 'default'
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

// Index for efficient queries
inboxRotationSchema.index({ userId: 1, status: 1 });
inboxRotationSchema.index({ rotationGroup: 1, warmupLevel: -1 });

export default mongoose.model('InboxRotation', inboxRotationSchema);
