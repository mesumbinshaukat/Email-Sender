import mongoose from 'mongoose';

const workflowSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  nodes: [{
    id: String,
    type: String, // 'trigger', 'action', 'condition'
    position: { x: Number, y: Number },
    data: mongoose.Schema.Types.Mixed
  }],
  edges: [{
    id: String,
    source: String,
    target: String,
    type: String
  }],
  isActive: {
    type: Boolean,
    default: false
  },
  triggers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trigger'
  }]
}, {
  timestamps: true
});

const Workflow = mongoose.model('Workflow', workflowSchema);

export default Workflow;
