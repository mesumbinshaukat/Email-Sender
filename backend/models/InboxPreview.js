import mongoose from 'mongoose';

const inboxPreviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Email',
    required: true
  },
  previews: [{
    client: {
      type: String,
      enum: ['gmail', 'outlook', 'yahoo', 'apple_mail', 'thunderbird', 'iphone', 'android', 'webmail'],
      required: true
    },
    device: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet'],
      default: 'desktop'
    },
    screenshot: String, // URL to screenshot
    html: String, // Rendered HTML
    text: String, // Plain text version
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    issues: [{
      type: {
        type: String,
        enum: ['css_unsupported', 'images_blocked', 'links_broken', 'mobile_unfriendly', 'spam_triggers']
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      message: String,
      suggestion: String
    }],
    generatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  overallScore: {
    type: Number,
    min: 0,
    max: 100
  },
  recommendations: [{
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    category: String,
    message: String,
    action: String
  }],
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  completedAt: Date
}, {
  timestamps: true
});

const InboxPreview = mongoose.model('InboxPreview', inboxPreviewSchema);

export default InboxPreview;
