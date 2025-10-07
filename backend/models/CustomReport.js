import mongoose from 'mongoose';

const customReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true },
  description: String,
  type: {
    type: String,
    enum: ['email_performance', 'campaign_analysis', 'contact_segmentation', 'revenue_tracking', 'custom'],
    required: true
  },
  config: {
    dateRange: {
      start: Date,
      end: Date,
      preset: {
        type: String,
        enum: ['last_7_days', 'last_30_days', 'last_90_days', 'last_year', 'custom']
      }
    },
    filters: mongoose.Schema.Types.Mixed, // Dynamic filters
    metrics: [String], // Which metrics to include
    groupBy: [String], // How to group data
    visualization: {
      type: {
        type: String,
        enum: ['table', 'bar_chart', 'line_chart', 'pie_chart', 'heatmap'],
        default: 'table'
      },
      options: mongoose.Schema.Types.Mixed
    }
  },
  schedule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'never']
    },
    recipients: [String], // Email addresses
    nextRun: Date,
    isActive: { type: Boolean, default: false }
  },
  data: mongoose.Schema.Types.Mixed, // Cached report data
  lastGenerated: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

customReportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const CustomReport = mongoose.model('CustomReport', customReportSchema);

export default CustomReport;
