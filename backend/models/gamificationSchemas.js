import mongoose from 'mongoose';

// Email Gamification
const gamificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: [{
    name: String,
    description: String,
    icon: String,
    earnedAt: Date,
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      default: 'common'
    }
  }],
  achievements: [{
    type: {
      type: String,
      enum: ['emails_sent', 'open_rate', 'click_rate', 'campaign_completed', 'contact_growth']
    },
    count: Number,
    target: Number,
    completed: { type: Boolean, default: false },
    completedAt: Date
  }],
  leaderboard: {
    position: Number,
    score: Number,
    lastUpdated: Date
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Voice-to-Email
const voiceEmailSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  audioUrl: String,
  transcription: String,
  emailContent: {
    subject: String,
    body: String,
    html: String
  },
  status: {
    type: String,
    enum: ['processing', 'transcribed', 'generated', 'sent', 'failed'],
    default: 'processing'
  },
  confidence: Number,
  duration: Number,
  language: { type: String, default: 'en' },
  createdAt: { type: Date, default: Date.now }
});

// Email Templates Marketplace
const templateMarketplaceSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: { type: String, required: true },
  description: String,
  category: {
    type: String,
    enum: ['welcome', 'newsletter', 'promotional', 'transactional', 'educational'],
    required: true
  },
  thumbnail: String,
  html: String,
  css: String,
  variables: [String], // Dynamic variables
  price: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: Number,
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  tags: [String],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// AI Email Coach
const aiCoachSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  insights: [{
    type: {
      type: String,
      enum: ['subject_line', 'content_quality', 'send_timing', 'audience_segmentation', 'engagement']
    },
    message: String,
    impact: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    action: String,
    implemented: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  performance: {
    currentScore: { type: Number, min: 0, max: 100, default: 0 },
    previousScore: Number,
    trend: {
      type: String,
      enum: ['improving', 'stable', 'declining'],
      default: 'stable'
    }
  },
  goals: [{
    type: {
      type: String,
      enum: ['increase_open_rate', 'boost_click_rate', 'grow_subscribers', 'improve_deliverability']
    },
    target: Number,
    current: Number,
    deadline: Date,
    status: {
      type: String,
      enum: ['active', 'completed', 'overdue'],
      default: 'active'
    }
  }],
  lastAnalyzed: Date,
  createdAt: { type: Date, default: Date.now }
});

// Blockchain Email Verification
const blockchainVerificationSchema = new mongoose.Schema({
  email: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Email',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hash: { type: String, required: true },
  blockchain: {
    type: String,
    enum: ['ethereum', 'polygon', 'bsc', 'solana'],
    default: 'polygon'
  },
  transactionHash: String,
  blockNumber: Number,
  timestamp: Date,
  verificationUrl: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  immutable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Gamification = mongoose.model('Gamification', gamificationSchema);
const VoiceEmail = mongoose.model('VoiceEmail', voiceEmailSchema);
const TemplateMarketplace = mongoose.model('TemplateMarketplace', templateMarketplaceSchema);
const AICoach = mongoose.model('AICoach', aiCoachSchema);
const BlockchainVerification = mongoose.model('BlockchainVerification', blockchainVerificationSchema);

export {
  Gamification,
  VoiceEmail,
  TemplateMarketplace,
  AICoach,
  BlockchainVerification
};
