import AIProvider from '../models/AIProvider.js';
import { getAIClient } from '../utils/openaiHelper.js';
import axios from 'axios';

// @desc    Get all AI providers for user
// @route   GET /api/ai-providers
// @access  Private
export const getAIProviders = async (req, res) => {
  try {
    const providers = await AIProvider.find({ userId: req.user._id })
      .select('-apiKey')
      .sort({ isDefault: -1, createdAt: -1 });

    // Mask API keys for security
    const maskedProviders = providers.map(p => {
      const obj = p.toObject();
      return {
        ...obj,
        apiKeyPreview: obj.apiKey ? '••••••••' + obj.apiKey.slice(-4) : ''
      };
    });

    res.json({
      success: true,
      data: maskedProviders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching AI providers',
      error: error.message
    });
  }
};

// @desc    Add new AI provider
// @route   POST /api/ai-providers
// @access  Private
export const addAIProvider = async (req, res) => {
  try {
    const { provider, apiKey, isDefault, config } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Provider and API key are required'
      });
    }

    // Validate provider
    const validProviders = ['openrouter', 'openai', 'gemini', 'grok', 'anthropic'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({
        success: false,
        message: `Invalid provider. Must be one of: ${validProviders.join(', ')}`
      });
    }

    // Check if provider already exists
    const existing = await AIProvider.findOne({
      userId: req.user._id,
      provider
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `${provider} provider already configured. Use update endpoint to modify.`
      });
    }

    // Create new provider
    const newProvider = await AIProvider.create({
      userId: req.user._id,
      provider,
      apiKey,
      isDefault: isDefault || false,
      config: config || {}
    });

    res.status(201).json({
      success: true,
      message: 'AI provider added successfully',
      data: {
        _id: newProvider._id,
        provider: newProvider.provider,
        isDefault: newProvider.isDefault,
        isActive: newProvider.isActive,
        config: newProvider.config
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding AI provider',
      error: error.message
    });
  }
};

// @desc    Update AI provider
// @route   PUT /api/ai-providers/:id
// @access  Private
export const updateAIProvider = async (req, res) => {
  try {
    const { apiKey, isDefault, isActive, config } = req.body;

    const provider = await AIProvider.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'AI provider not found'
      });
    }

    if (apiKey) provider.apiKey = apiKey;
    if (isDefault !== undefined) provider.isDefault = isDefault;
    if (isActive !== undefined) provider.isActive = isActive;
    if (config) provider.config = { ...provider.config, ...config };

    await provider.save();

    res.json({
      success: true,
      message: 'AI provider updated successfully',
      data: {
        _id: provider._id,
        provider: provider.provider,
        isDefault: provider.isDefault,
        isActive: provider.isActive,
        config: provider.config
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating AI provider',
      error: error.message
    });
  }
};

// @desc    Delete AI provider
// @route   DELETE /api/ai-providers/:id
// @access  Private
export const deleteAIProvider = async (req, res) => {
  try {
    const provider = await AIProvider.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'AI provider not found'
      });
    }

    res.json({
      success: true,
      message: 'AI provider deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting AI provider',
      error: error.message
    });
  }
};

// @desc    Test AI provider connection
// @route   POST /api/ai-providers/test
// @access  Private
export const testAIProvider = async (req, res) => {
  try {
    const { provider, apiKey, model } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Provider and API key are required'
      });
    }

    let testResult = { success: false, message: '', models: [] };

    try {
      switch (provider) {
        case 'openrouter':
          const orResponse = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
              model: model || 'openai/gpt-3.5-turbo',
              messages: [{ role: 'user', content: 'Hello' }],
              max_tokens: 10
            },
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          testResult = {
            success: true,
            message: 'OpenRouter API key is valid',
            response: orResponse.data.choices[0].message.content
          };
          break;

        case 'openai':
          const { OpenAI } = await import('openai');
          const openai = new OpenAI({ apiKey });
          const oaiResponse = await openai.chat.completions.create({
            model: model || 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 10
          });
          testResult = {
            success: true,
            message: 'OpenAI API key is valid',
            response: oaiResponse.choices[0].message.content
          };
          break;

        case 'gemini':
          const geminiResponse = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
            {
              contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
            }
          );
          testResult = {
            success: true,
            message: 'Gemini API key is valid',
            response: geminiResponse.data.candidates[0].content.parts[0].text
          };
          break;

        case 'grok':
          const grokResponse = await axios.post(
            'https://api.x.ai/v1/chat/completions',
            {
              model: model || 'grok-beta',
              messages: [{ role: 'user', content: 'Hello' }],
              max_tokens: 10
            },
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          testResult = {
            success: true,
            message: 'Grok API key is valid',
            response: grokResponse.data.choices[0].message.content
          };
          break;

        case 'anthropic':
          const anthropicResponse = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
              model: model || 'claude-3-sonnet-20240229',
              messages: [{ role: 'user', content: 'Hello' }],
              max_tokens: 10
            },
            {
              headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
              }
            }
          );
          testResult = {
            success: true,
            message: 'Anthropic API key is valid',
            response: anthropicResponse.data.content[0].text
          };
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Unsupported provider'
          });
      }

      res.json(testResult);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: `Invalid ${provider} API key`,
        error: error.response?.data?.error?.message || error.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error testing AI provider',
      error: error.message
    });
  }
};

// @desc    Get available models for a provider
// @route   GET /api/ai-providers/models/:provider
// @access  Private
export const getAvailableModels = async (req, res) => {
  try {
    const { provider } = req.params;

    const models = {
      openrouter: [
        { id: 'openai/gpt-4-turbo-preview', name: 'GPT-4 Turbo', provider: 'OpenAI' },
        { id: 'openai/gpt-4', name: 'GPT-4', provider: 'OpenAI' },
        { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
        { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
        { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
        { id: 'google/gemini-pro', name: 'Gemini Pro', provider: 'Google' },
        { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B', provider: 'Meta' },
        { id: 'mistralai/mixtral-8x7b-instruct', name: 'Mixtral 8x7B', provider: 'Mistral' }
      ],
      openai: [
        { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo' },
        { id: 'gpt-4', name: 'GPT-4' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
        { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K' }
      ],
      gemini: [
        { id: 'gemini-pro', name: 'Gemini Pro' },
        { id: 'gemini-pro-vision', name: 'Gemini Pro Vision' }
      ],
      grok: [
        { id: 'grok-beta', name: 'Grok Beta' }
      ],
      anthropic: [
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
        { id: 'claude-2.1', name: 'Claude 2.1' }
      ]
    };

    if (!models[provider]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid provider'
      });
    }

    res.json({
      success: true,
      data: models[provider]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching models',
      error: error.message
    });
  }
};

// @desc    Set default AI provider
// @route   PUT /api/ai-providers/:id/set-default
// @access  Private
export const setDefaultProvider = async (req, res) => {
  try {
    const provider = await AIProvider.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'AI provider not found'
      });
    }

    provider.isDefault = true;
    await provider.save();

    res.json({
      success: true,
      message: 'Default provider updated successfully',
      data: {
        _id: provider._id,
        provider: provider.provider,
        isDefault: provider.isDefault
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error setting default provider',
      error: error.message
    });
  }
};
