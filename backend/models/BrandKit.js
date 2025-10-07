import mongoose from 'mongoose';

const brandKitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  logo: {
    url: String,
    alt: String
  },
  colors: {
    primary: String,
    secondary: String,
    accent: String
  },
  fonts: {
    heading: {
      family: String,
      weight: String
    },
    body: {
      family: String,
      weight: String
    }
  },
  brandGuidelines: {
    type: String
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const BrandKit = mongoose.model('BrandKit', brandKitSchema);

export default BrandKit;
