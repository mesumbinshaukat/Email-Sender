import mongoose from 'mongoose';

const bulkJobSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  csvData: [{
    email: String,
    firstName: String,
    lastName: String,
    company: String,
    customFields: mongoose.Schema.Types.Mixed
  }],
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate'
  },
  personalizationFields: [{
    field: String,
    value: String,
    aiGenerated: { type: Boolean, default: false }
  }],
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  totalContacts: {
    type: Number,
    default: 0
  },
  processedContacts: {
    type: Number,
    default: 0
  },
  sentEmails: {
    type: Number,
    default: 0
  },
  errors: [{
    contactIndex: Number,
    error: String
  }],
  scheduledAt: Date,
  completedAt: Date
}, {
  timestamps: true
});

const BulkJob = mongoose.model('BulkJob', bulkJobSchema);

export default BulkJob;
