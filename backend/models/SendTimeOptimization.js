import mongoose from 'mongoose';

const sendTimeOptimizationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  segment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContactSegment'
  },
  status: {
    type: String,
    enum: ['analyzing', 'optimizing', 'ready', 'completed'],
    default: 'analyzing'
  },
  historicalData: [{
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact'
    },
    timezone: String,
    sentTime: Date,
    openedAt: Date,
    clickedAt: Date,
    engagement: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    }
  }],
  optimizedSchedule: [{
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6 // 0 = Sunday, 6 = Saturday
    },
    hour: {
      type: Number,
      min: 0,
      max: 23
    },
    expectedOpenRate: Number,
    expectedClickRate: Number,
    confidence: Number,
    contacts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact'
    }]
  }],
  performanceMetrics: {
    averageOpenRate: Number,
    averageClickRate: Number,
    bestDay: Number,
    bestHour: Number,
    improvement: Number // Percentage improvement over average
  },
  aiModel: {
    algorithm: {
      type: String,
      enum: ['random_forest', 'neural_network', 'gradient_boosting'],
      default: 'random_forest'
    },
    accuracy: Number,
    features: [String],
    trainedAt: Date
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

// Update updatedAt on save
sendTimeOptimizationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const SendTimeOptimization = mongoose.model('SendTimeOptimization', sendTimeOptimizationSchema);

export default SendTimeOptimization;
