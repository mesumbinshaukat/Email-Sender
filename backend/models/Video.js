import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  url: {
    type: String,
    required: true
  },
  thumbnailUrl: String,
  duration: Number,
  size: Number,
  format: String,
  altText: String,
  fallbackImageUrl: String,
  engagement: {
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    plays: { type: Number, default: 0 }
  },
  tags: [String]
}, {
  timestamps: true
});

const Video = mongoose.model('Video', videoSchema);

export default Video;
