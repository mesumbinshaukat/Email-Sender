import mongoose from 'mongoose';

const gifSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  url: {
    type: String,
    required: true
  },
  altText: String,
  category: String,
  tags: [String],
  usage: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Gif = mongoose.model('Gif', gifSchema);

export default Gif;
