import mongoose from 'mongoose';

const attributionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  touchpoints: [{
    type: {
      type: String,
      enum: ['email_open', 'email_click', 'website_visit', 'form_submit', 'purchase']
    },
    timestamp: Date,
    email: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Email'
    },
    value: Number, // revenue attributed to this touchpoint
    source: String // UTM parameters, referral, etc.
  }],
  conversion: {
    occurred: { type: Boolean, default: false },
    timestamp: Date,
    value: { type: Number, default: 0 },
    type: String // purchase, signup, etc.
  },
  attributionModel: {
    type: String,
    enum: ['first_touch', 'last_touch', 'linear', 'time_decay', 'custom'],
    default: 'last_touch'
  },
  totalRevenue: { type: Number, default: 0 },
  customerJourney: [{
    stage: String,
    timestamp: Date,
    action: String,
    details: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

const Attribution = mongoose.model('Attribution', attributionSchema);

export default Attribution;
