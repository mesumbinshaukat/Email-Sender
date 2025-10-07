import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['email_bounce', 'low_open_rate', 'unusual_traffic', 'goal_achieved', 'system_error'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved'],
    default: 'active'
  },
  data: mongoose.Schema.Types.Mixed, // Additional context data
  channels: [{
    type: String,
    enum: ['email', 'slack', 'webhook', 'sms']
  }],
  triggers: {
    threshold: Number,
    condition: String,
    frequency: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;
