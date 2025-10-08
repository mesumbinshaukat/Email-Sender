import { OpenAI } from 'openai';
import axios from 'axios';
import AIProvider from '../models/AIProvider.js';
import { getEnvVar } from './envManager.js';

/**
 * Get AI client based on user's configured provider
 * Supports: OpenRouter (default), OpenAI, Gemini, Grok, Anthropic
 * @param {string} userId - User ID to fetch their AI provider config
 * @param {string} preferredProvider - Optional provider override
 * @returns {Promise<Object>} AI client with callAI method
 * @throws {Error} If no provider is configured
 */
export const getAIClient = async (userId = null, preferredProvider = null) => {
  try {
    let providerConfig;

    // Try to get user's configured provider
    if (userId) {
      if (preferredProvider) {
        providerConfig = await AIProvider.findOne({
          userId,
          provider: preferredProvider,
          isActive: true
        });
      }
      
      if (!providerConfig) {
        // Get default provider for user
        providerConfig = await AIProvider.findOne({
          userId,
          isDefault: true,
          isActive: true
        });
      }

      if (!providerConfig) {
        // Get any active provider
        providerConfig = await AIProvider.findOne({
          userId,
          isActive: true
        });
      }
    }

    // Fallback to environment variables
    if (!providerConfig) {
      const openRouterKey = await getEnvVar('OPENROUTER_API_KEY');
      const openAIKey = await getEnvVar('OPENAI_API_KEY');
      
      if (openRouterKey) {
        return createOpenRouterClient(openRouterKey);
      } else if (openAIKey) {
        return createOpenAIClient(openAIKey);
      } else {
        throw new Error('No AI provider configured. Please configure an AI provider in settings.');
      }
    }

    // Create client based on provider
    switch (providerConfig.provider) {
      case 'openrouter':
        return createOpenRouterClient(providerConfig.apiKey, providerConfig.config);
      case 'openai':
        return createOpenAIClient(providerConfig.apiKey, providerConfig.config);
      case 'gemini':
        return createGeminiClient(providerConfig.apiKey, providerConfig.config);
      case 'grok':
        return createGrokClient(providerConfig.apiKey, providerConfig.config);
      case 'anthropic':
        return createAnthropicClient(providerConfig.apiKey, providerConfig.config);
      default:
        throw new Error(`Unsupported provider: ${providerConfig.provider}`);
    }
  } catch (error) {
    console.error('Error getting AI client:', error.message);
    throw error;
  }
};

/**
 * Create OpenRouter client (default)
 */
const createOpenRouterClient = (apiKey, config = {}) => {
  return {
    provider: 'openrouter',
    chat: {
      completions: {
        create: async (params) => {
          const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
              model: config.model || params.model || 'openai/gpt-3.5-turbo',
              messages: params.messages,
              temperature: config.temperature || params.temperature || 0.7,
              max_tokens: config.maxTokens || params.max_tokens || 1500
            },
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': process.env.BACKEND_URL || 'http://localhost:5000',
                'X-Title': 'Email Tracker AI',
                'Content-Type': 'application/json'
              }
            }
          );
          return response.data;
        }
      }
    }
  };
};

/**
 * Create OpenAI client
 */
const createOpenAIClient = (apiKey, config = {}) => {
  const client = new OpenAI({ apiKey });
  return {
    provider: 'openai',
    chat: {
      completions: {
        create: async (params) => {
          return await client.chat.completions.create({
            model: config.model || params.model || 'gpt-3.5-turbo',
            messages: params.messages,
            temperature: config.temperature || params.temperature || 0.7,
            max_tokens: config.maxTokens || params.max_tokens || 1500
          });
        }
      }
    }
  };
};

/**
 * Create Gemini client
 */
const createGeminiClient = (apiKey, config = {}) => {
  return {
    provider: 'gemini',
    chat: {
      completions: {
        create: async (params) => {
          const model = config.model || 'gemini-pro';
          const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
            {
              contents: params.messages.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
              })),
              generationConfig: {
                temperature: config.temperature || params.temperature || 0.7,
                maxOutputTokens: config.maxTokens || params.max_tokens || 1500
              }
            }
          );
          
          // Convert Gemini response to OpenAI format
          return {
            choices: [{
              message: {
                content: response.data.candidates[0].content.parts[0].text,
                role: 'assistant'
              }
            }],
            usage: {
              total_tokens: response.data.usageMetadata?.totalTokenCount || 0
            }
          };
        }
      }
    }
  };
};

/**
 * Create Grok client
 */
const createGrokClient = (apiKey, config = {}) => {
  return {
    provider: 'grok',
    chat: {
      completions: {
        create: async (params) => {
          const response = await axios.post(
            'https://api.x.ai/v1/chat/completions',
            {
              model: config.model || 'grok-beta',
              messages: params.messages,
              temperature: config.temperature || params.temperature || 0.7,
              max_tokens: config.maxTokens || params.max_tokens || 1500
            },
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          return response.data;
        }
      }
    }
  };
};

/**
 * Create Anthropic client
 */
const createAnthropicClient = (apiKey, config = {}) => {
  return {
    provider: 'anthropic',
    chat: {
      completions: {
        create: async (params) => {
          const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
              model: config.model || 'claude-3-sonnet-20240229',
              messages: params.messages.filter(m => m.role !== 'system'),
              system: params.messages.find(m => m.role === 'system')?.content,
              temperature: config.temperature || params.temperature || 0.7,
              max_tokens: config.maxTokens || params.max_tokens || 1500
            },
            {
              headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
              }
            }
          );
          
          // Convert Anthropic response to OpenAI format
          return {
            choices: [{
              message: {
                content: response.data.content[0].text,
                role: 'assistant'
              }
            }],
            usage: {
              total_tokens: response.data.usage?.input_tokens + response.data.usage?.output_tokens || 0
            }
          };
        }
      }
    }
  };
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use getAIClient instead
 */
export const getOpenAIClient = async (userId = null) => {
  return getAIClient(userId, 'openai');
};

/**
 * Check if any AI provider is configured
 */
export const isAIConfigured = async (userId = null) => {
  try {
    if (userId) {
      const provider = await AIProvider.findOne({ userId, isActive: true });
      if (provider) return true;
    }
    
    const openRouterKey = await getEnvVar('OPENROUTER_API_KEY');
    const openAIKey = await getEnvVar('OPENAI_API_KEY');
    
    return !!(openRouterKey || openAIKey);
  } catch (error) {
    return false;
  }
};

/**
 * Middleware to check if AI is configured
 */
export const requireAI = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const configured = await isAIConfigured(userId);
    
    if (!configured) {
      return res.status(400).json({
        success: false,
        message: 'AI provider not configured',
        code: 'AI_NOT_CONFIGURED',
        action: 'Please configure an AI provider (OpenRouter, OpenAI, Gemini, or Grok) in settings'
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking AI configuration',
      error: error.message
    });
  }
};

// Export legacy names for backward compatibility
export const isOpenAIConfigured = isAIConfigured;
export const requireOpenAI = requireAI;
