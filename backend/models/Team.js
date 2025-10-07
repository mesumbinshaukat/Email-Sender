import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'editor', 'viewer'],
      default: 'viewer'
    },
    permissions: {
      sendEmails: { type: Boolean, default: false },
      manageContacts: { type: Boolean, default: false },
      viewAnalytics: { type: Boolean, default: true },
      manageTemplates: { type: Boolean, default: false },
      manageIntegrations: { type: Boolean, default: false }
    },
    invitedAt: { type: Date, default: Date.now },
    joinedAt: Date
  }],
  campaigns: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  }],
  templates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate'
  }],
  settings: {
    allowMemberInvites: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: false },
    sharedContacts: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

teamSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Team = mongoose.model('Team', teamSchema);

export default Team;
