import mongoose from 'mongoose';

const aiTrainingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  modelType: {
    type: String,
    enum: ['content_generator', 'subject_optimizer', 'send_time_predictor', 'audience_segmenter'],
    required: true
  },
  status: {
    type: String,
    enum: ['training', 'ready', 'failed', 'updating'],
    default: 'training'
  },
  trainingData: {
    size: Number,
    quality: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    lastUpdated: Date
  },
  performance: {
    accuracy: Number,
    precision: Number,
    recall: Number,
    f1Score: Number,
    lastEvaluated: Date
  },
  hyperparameters: mongoose.Schema.Types.Mixed,
  version: { type: Number, default: 1 },
  isActive: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

aiTrainingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const AITraining = mongoose.model('AITraining', aiTrainingSchema);

export default AITraining;
