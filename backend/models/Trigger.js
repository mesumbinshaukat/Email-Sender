import mongoose from 'mongoose';

const triggerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: String,
  type: {
    type: String,
    enum: ['email_open', 'email_click', 'website_visit', 'form_submit', 'time_based', 'custom'],
    required: true
  },
  conditions: mongoose.Schema.Types.Mixed,
  actions: [{
    type: String, // 'send_email', 'update_contact', 'create_task'
    config: mongoose.Schema.Types.Mixed
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  workflow: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow'
  }
}, {
  timestamps: true
});

const Trigger = mongoose.model('Trigger', triggerSchema);

export default Trigger;
