import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  name: {
    first: String,
    last: String,
    full: String,
  },
  company: {
    name: String,
    website: String,
    industry: String,
    size: String,
    linkedin: String,
  },
  position: {
    title: String,
    level: String, // junior, senior, executive, etc.
    department: String,
  },
  location: {
    city: String,
    state: String,
    country: String,
    timezone: String,
  },
  social: {
    linkedin: String,
    twitter: String,
    github: String,
    website: String,
  },
  enrichment: {
    lastEnriched: Date,
    sources: [{
      type: String, // 'linkedin', 'company_website', 'news', 'ai_generated'
      url: String,
      data: mongoose.Schema.Types.Mixed,
      enrichedAt: Date,
    }],
    icebreakers: [{
      text: String,
      category: String, // 'personal', 'professional', 'company', 'news'
      confidence: Number,
      generatedAt: Date,
    }],
    talkingPoints: [{
      topic: String,
      content: String,
      relevance: Number,
      category: String,
      generatedAt: Date,
    }],
    news: [{
      title: String,
      summary: String,
      url: String,
      publishedAt: Date,
      relevance: Number,
    }],
  },
  tags: [{ type: String }],
  lists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ContactList' }],
  engagement: {
    totalEmails: { type: Number, default: 0 },
    openRate: { type: Number, default: 0 },
    clickRate: { type: Number, default: 0 },
    lastContacted: Date,
    bestTimeToContact: String,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'bounced', 'unsubscribed'],
    default: 'active',
  },
}, {
  timestamps: true,
});

// Indexes
contactSchema.index({ userId: 1, email: 1 }, { unique: true });
contactSchema.index({ 'enrichment.lastEnriched': 1 });
contactSchema.index({ tags: 1 });

// Virtual for full name
contactSchema.virtual('fullName').get(function() {
  if (this.name.full) return this.name.full;
  if (this.name.first && this.name.last) return `${this.name.first} ${this.name.last}`;
  return this.name.first || this.name.last || 'Unknown';
});

// Method to get primary icebreaker
contactSchema.methods.getPrimaryIcebreaker = function() {
  return this.enrichment.icebreakers.find(ib => ib.confidence > 0.8) ||
         this.enrichment.icebreakers[0];
};

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;
