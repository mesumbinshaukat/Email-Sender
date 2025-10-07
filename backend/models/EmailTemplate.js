import mongoose from 'mongoose';

const emailTemplateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  html: {
    type: String,
    required: true
  },
  css: {
    type: String
  },
  variables: [{
    name: String,
    type: String,
    defaultValue: String
  }],
  brandKit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BrandKit'
  },
  isResponsive: {
    type: Boolean,
    default: true
  },
  isDarkMode: {
    type: Boolean,
    default: false
  },
  accessibilityScore: {
    type: Number,
    default: 0
  },
  tags: [String],
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);

export default EmailTemplate;
