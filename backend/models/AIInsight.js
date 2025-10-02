import mongoose from 'mongoose';

const aiInsightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    emailId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Email',
      index: true,
    },
    insightType: {
      type: String,
      enum: [
        'email_generation',
        'subject_optimization',
        'send_time_prediction',
        'response_prediction',
        'sentiment_analysis',
        'spam_score',
        'follow_up_suggestion',
        'segmentation',
        'health_score',
        'conversation_intelligence',
      ],
      required: true,
    },
    input: mongoose.Schema.Types.Mixed,
    output: mongoose.Schema.Types.Mixed,
    metadata: {
      model: String,
      processingTime: Number,
      confidence: Number,
      tokens: Number,
    },
    feedback: {
      rating: Number,
      comment: String,
      accepted: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
aiInsightSchema.index({ userId: 1, insightType: 1, createdAt: -1 });

const AIInsight = mongoose.model('AIInsight', aiInsightSchema);

export default AIInsight;
