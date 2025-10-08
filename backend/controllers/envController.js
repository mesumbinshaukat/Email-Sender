import { getEnvVar, setEnvVar, getAllEnvVars } from '../utils/envManager.js';
import EnvironmentVariable from '../models/EnvironmentVariable.js';

// @desc    Get all environment variables (masked)
// @route   GET /api/env
// @access  Private (Admin only)
export const getEnvironmentVariables = async (req, res) => {
  try {
    const variables = await EnvironmentVariable.find({})
      .select('-__v')
      .sort({ category: 1, key: 1 });

    // Mask sensitive values
    const maskedVariables = variables.map(v => ({
      _id: v._id,
      key: v.key,
      value: v.value ? '••••••••' + v.value.slice(-4) : '',
      description: v.description,
      category: v.category,
      isEncrypted: v.isEncrypted,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt
    }));

    res.json({
      success: true,
      data: maskedVariables
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching environment variables',
      error: error.message
    });
  }
};

// @desc    Get specific environment variable status
// @route   GET /api/env/:key/status
// @access  Private
export const getVariableStatus = async (req, res) => {
  try {
    const { key } = req.params;
    const value = await getEnvVar(key);

    res.json({
      success: true,
      data: {
        key,
        configured: !!value,
        hasValue: !!value
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking variable status',
      error: error.message
    });
  }
};

// @desc    Set environment variable
// @route   POST /api/env
// @access  Private (Admin only)
export const setEnvironmentVariable = async (req, res) => {
  try {
    const { key, value, description, category } = req.body;

    if (!key || !value) {
      return res.status(400).json({
        success: false,
        message: 'Key and value are required'
      });
    }

    // Validate category
    const validCategories = ['api_keys', 'database', 'smtp', 'integrations'];
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    await setEnvVar(key, value, description, category);

    res.json({
      success: true,
      message: 'Environment variable set successfully',
      data: {
        key,
        configured: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error setting environment variable',
      error: error.message
    });
  }
};

// @desc    Update environment variable
// @route   PUT /api/env/:key
// @access  Private (Admin only)
export const updateEnvironmentVariable = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description, category } = req.body;

    const envVar = await EnvironmentVariable.findOne({ key });
    if (!envVar) {
      return res.status(404).json({
        success: false,
        message: 'Environment variable not found'
      });
    }

    if (value) envVar.value = value;
    if (description !== undefined) envVar.description = description;
    if (category) envVar.category = category;

    await envVar.save();

    // Update cache
    await setEnvVar(key, envVar.value, envVar.description, envVar.category);

    res.json({
      success: true,
      message: 'Environment variable updated successfully',
      data: {
        key,
        configured: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating environment variable',
      error: error.message
    });
  }
};

// @desc    Delete environment variable
// @route   DELETE /api/env/:key
// @access  Private (Admin only)
export const deleteEnvironmentVariable = async (req, res) => {
  try {
    const { key } = req.params;

    const result = await EnvironmentVariable.findOneAndDelete({ key });
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Environment variable not found'
      });
    }

    res.json({
      success: true,
      message: 'Environment variable deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting environment variable',
      error: error.message
    });
  }
};

// @desc    Test API key configuration
// @route   POST /api/env/test/:service
// @access  Private
export const testAPIKey = async (req, res) => {
  try {
    const { service } = req.params;
    const { apiKey } = req.body;

    let testResult = { success: false, message: '' };

    switch (service) {
      case 'openai':
        try {
          const { OpenAI } = await import('openai');
          const testKey = apiKey || await getEnvVar('OPENAI_API_KEY');
          
          if (!testKey) {
            return res.status(400).json({
              success: false,
              message: 'OpenAI API key not provided'
            });
          }

          const openai = new OpenAI({ apiKey: testKey });
          await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 5
          });

          testResult = {
            success: true,
            message: 'OpenAI API key is valid'
          };
        } catch (error) {
          testResult = {
            success: false,
            message: 'Invalid OpenAI API key'
          };
        }
        break;

      case 'openrouter':
        try {
          const axios = (await import('axios')).default;
          const testKey = apiKey || await getEnvVar('OPENROUTER_API_KEY');
          
          if (!testKey) {
            return res.status(400).json({
              success: false,
              message: 'OpenRouter API key not provided'
            });
          }

          await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
              model: 'openai/gpt-3.5-turbo',
              messages: [{ role: 'user', content: 'test' }],
              max_tokens: 5
            },
            {
              headers: {
                'Authorization': `Bearer ${testKey}`,
                'Content-Type': 'application/json'
              }
            }
          );

          testResult = {
            success: true,
            message: 'OpenRouter API key is valid'
          };
        } catch (error) {
          testResult = {
            success: false,
            message: 'Invalid OpenRouter API key'
          };
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported service'
        });
    }

    res.json(testResult);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error testing API key',
      error: error.message
    });
  }
};
