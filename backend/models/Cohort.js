import mongoose from 'mongoose';

const cohortSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  signupDate: {
    type: Date,
    required: true
  },
  segmentType: {
    type: String,
    enum: ['monthly', 'weekly', 'daily'],
    default: 'monthly'
  },
  members: [{
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact'
    },
    signupDate: Date,
    lastActivity: Date,
    metrics: {
      emailsReceived: { type: Number, default: 0 },
      emailsOpened: { type: Number, default: 0 },
      emailsClicked: { type: Number, default: 0 },
      purchases: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 }
    }
  }],
  retentionRates: [{
    period: Number, // days/weeks/months since signup
    retained: Number,
    churned: Number,
    retentionRate: Number
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Cohort = mongoose.model('Cohort', cohortSchema);

export default Cohort;
