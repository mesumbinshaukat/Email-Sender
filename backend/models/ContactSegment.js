import mongoose from 'mongoose';

const contactSegmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: String,
    segmentType: {
      type: String,
      enum: ['manual', 'ai_generated', 'behavioral', 'predictive'],
      default: 'manual',
    },
    criteria: {
      engagementLevel: {
        type: String,
        enum: ['hot', 'warm', 'cold', 'inactive'],
      },
      openRate: {
        min: Number,
        max: Number,
      },
      clickRate: {
        min: Number,
        max: Number,
      },
      lastEngagement: Date,
      predictedChurn: Boolean,
      customFilters: mongoose.Schema.Types.Mixed,
    },
    contacts: [
      {
        email: String,
        name: String,
        engagementScore: Number,
        lastInteraction: Date,
        metadata: mongoose.Schema.Types.Mixed,
      },
    ],
    aiInsights: {
      churnPrediction: Number,
      bestSendTime: String,
      preferredContentType: String,
      responseLikelihood: Number,
    },
    stats: {
      totalContacts: { type: Number, default: 0 },
      avgEngagementScore: { type: Number, default: 0 },
      avgOpenRate: { type: Number, default: 0 },
      avgClickRate: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

const ContactSegment = mongoose.model('ContactSegment', contactSegmentSchema);

export default ContactSegment;
