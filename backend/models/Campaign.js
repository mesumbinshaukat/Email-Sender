import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'active', 'paused', 'completed'],
      default: 'draft',
    },
    emails: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Email',
      },
    ],
    segments: [String],
    aiOptimization: {
      enabled: Boolean,
      autoAdjustSendTime: Boolean,
      autoOptimizeSubject: Boolean,
      autoFollowUp: Boolean,
      learningData: mongoose.Schema.Types.Mixed,
    },
    performance: {
      totalSent: { type: Number, default: 0 },
      totalOpens: { type: Number, default: 0 },
      totalClicks: { type: Number, default: 0 },
      totalResponses: { type: Number, default: 0 },
      openRate: { type: Number, default: 0 },
      clickRate: { type: Number, default: 0 },
      responseRate: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
    },
    schedule: {
      startDate: Date,
      endDate: Date,
      frequency: String,
      timezone: String,
    },
  },
  {
    timestamps: true,
  }
);

const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;
