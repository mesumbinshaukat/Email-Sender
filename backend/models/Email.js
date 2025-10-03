import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    trackingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
    },
    recipients: {
      to: [{ type: String, required: true }],
      cc: [{ type: String }],
      bcc: [{ type: String }],
    },
    body: {
      html: { type: String },
      text: { type: String },
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending'],
      default: 'pending',
    },
    sentAt: {
      type: Date,
    },
    tracking: {
      opens: [
        {
          timestamp: { type: Date, default: Date.now },
          ipAddress: String,
          userAgent: String,
          location: String,
        },
      ],
      clicks: [
        {
          url: String,
          timestamp: { type: Date, default: Date.now },
          ipAddress: String,
          userAgent: String,
        },
      ],
      totalOpens: { type: Number, default: 0 },
      totalClicks: { type: Number, default: 0 },
      firstOpenedAt: { type: Date },
      lastOpenedAt: { type: Date },
      totalReadTime: { type: Number, default: 0 }, // in seconds
      readSessions: [
        {
          startTime: { type: Date },
          endTime: { type: Date },
          duration: { type: Number }, // in seconds
        },
      ],
    },
    metadata: {
      messageId: String,
      errorMessage: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
emailSchema.index({ userId: 1, createdAt: -1 });
// emailSchema.index({ trackingId: 1 }); // Removed - already indexed via index: true
emailSchema.index({ 'tracking.firstOpenedAt': 1 });

const Email = mongoose.model('Email', emailSchema);

export default Email;
