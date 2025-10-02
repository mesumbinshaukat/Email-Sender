import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['generated', 'saved', 'sent', 'tracked'],
      default: 'generated',
    },
    emailData: {
      subject: String,
      recipientEmail: String,
      body: String,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
    },
    subject: {
      type: String,
      required: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      index: true,
    },
    predictions: {
      openRate: {
        value: { type: Number, min: 0, max: 100 },
        confidence: { type: Number, min: 0, max: 100 },
        factors: [String],
      },
      clickRate: {
        value: { type: Number, min: 0, max: 100 },
        confidence: { type: Number, min: 0, max: 100 },
        factors: [String],
      },
      conversionRate: {
        value: { type: Number, min: 0, max: 100 },
        confidence: { type: Number, min: 0, max: 100 },
        factors: [String],
      },
      bestSendTime: {
        hour: { type: Number, min: 0, max: 23 },
        dayOfWeek: { type: Number, min: 0, max: 6 },
        confidence: { type: Number, min: 0, max: 100 },
      },
    },
    historicalData: {
      pastEmailsToRecipient: { type: Number, default: 0 },
      recipientOpenRate: { type: Number, default: 0 },
      recipientClickRate: { type: Number, default: 0 },
      subjectLength: { type: Number },
      hasEmoji: { type: Boolean },
      hasNumbers: { type: Boolean },
      hasQuestion: { type: Boolean },
      hasPersonalization: { type: Boolean },
    },
    actualResults: {
      opened: { type: Boolean, default: false },
      clicked: { type: Boolean, default: false },
      converted: { type: Boolean, default: false },
      openTime: Date,
      clickTime: Date,
    },
    accuracy: {
      openRateDiff: Number,
      clickRateDiff: Number,
      conversionRateDiff: Number,
      sendTimeAccuracy: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
predictionSchema.index({ userId: 1, recipientEmail: 1, createdAt: -1 });
predictionSchema.index({ emailId: 1 }, { sparse: true });

const Prediction = mongoose.model('Prediction', predictionSchema);

export default Prediction;
