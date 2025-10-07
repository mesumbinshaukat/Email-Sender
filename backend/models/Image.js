import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  altText: {
    type: String
  },
  optimizedUrl: {
    type: String
  },
  size: {
    type: Number
  },
  format: {
    type: String,
    default: 'png'
  },
  isOptimized: {
    type: Boolean,
    default: false
  },
  tags: [String],
  usage: {
    type: String,
    enum: ['header', 'banner', 'thumbnail', 'general'],
    default: 'general'
  }
}, {
  timestamps: true
});

const Image = mongoose.model('Image', imageSchema);

export default Image;
