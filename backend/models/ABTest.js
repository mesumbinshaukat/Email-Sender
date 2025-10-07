import mongoose from 'mongoose';

const abTestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  status: {
    type: String,
    enum: ['draft', 'running', 'completed', 'paused'],
    default: 'draft'
  },
  testType: {
    type: String,
    enum: ['subject_line', 'content', 'sender', 'send_time', 'design'],
    required: true
  },
  variants: [{
    name: String,
    content: mongoose.Schema.Types.Mixed, // Different content based on test type
    sampleSize: { type: Number, default: 0 },
    opens: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    bounceRate: { type: Number, default: 0 },
    unsubscribeRate: { type: Number, default: 0 }
  }],
  winner: {
    variantIndex: Number,
    confidence: Number,
    improvement: Number,
    criteria: String
  },
  settings: {
    sampleSize: { type: Number, default: 1000 },
    confidenceLevel: { type: Number, default: 95 },
    testDuration: { type: Number, default: 7 }, // days
    winnerCriteria: {
      type: String,
      enum: ['opens', 'clicks', 'conversions', 'revenue'],
      default: 'conversions'
    },
    autoDeclareWinner: { type: Boolean, default: true }
  },
  startedAt: Date,
  completedAt: Date,
  statisticalData: {
    chiSquare: Number,
    pValue: Number,
    significance: Boolean,
    effectSize: Number
  }
}, {
  timestamps: true
});

const ABTest = mongoose.model('ABTest', abTestSchema);

export default ABTest;
