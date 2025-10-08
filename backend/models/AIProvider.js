import mongoose from 'mongoose';

const aiProviderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: String,
    enum: ['openrouter', 'openai', 'gemini', 'grok', 'anthropic'],
    required: true
  },
  apiKey: {
    type: String,
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  config: {
    // Provider-specific configuration
    model: {
      type: String,
      default: function() {
        const defaults = {
          openrouter: 'deepseek/deepseek-chat-v3.1:free',
          openai: 'gpt-3.5-turbo',
          gemini: 'gemini-pro',
          grok: 'grok-beta',
          anthropic: 'claude-3-sonnet-20240229'
        };
        return defaults[this.provider] || 'gpt-3.5-turbo';
      }
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2
    },
    maxTokens: {
      type: Number,
      default: 1500
    },
    baseURL: {
      type: String,
      default: function() {
        const urls = {
          openrouter: 'https://openrouter.ai/api/v1',
          openai: 'https://api.openai.com/v1',
          gemini: 'https://generativelanguage.googleapis.com/v1',
          grok: 'https://api.x.ai/v1',
          anthropic: 'https://api.anthropic.com/v1'
        };
        return urls[this.provider] || 'https://openrouter.ai/api/v1';
      }
    }
  },
  usage: {
    totalRequests: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      default: 0
    },
    lastUsed: {
      type: Date
    }
  },
  metadata: {
    displayName: String,
    description: String,
    availableModels: [String]
  }
}, {
  timestamps: true
});

// Index for quick lookups
aiProviderSchema.index({ userId: 1, provider: 1 });
aiProviderSchema.index({ userId: 1, isDefault: 1 });

// Ensure only one default provider per user
aiProviderSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

const AIProvider = mongoose.model('AIProvider', aiProviderSchema);

export default AIProvider;
