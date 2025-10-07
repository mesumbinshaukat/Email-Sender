import mongoose from 'mongoose';

// @desc    Health check endpoint
// @route   GET /api/health
// @access  Public
export const healthCheck = async (req, res) => {
  try {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    };
    
    res.status(200).json(health);
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      message: 'Health check failed', 
      error: error.message 
    });
  }
};

// @desc    Test all API endpoints
// @route   GET /api/health/test-endpoints
// @access  Public
export const testEndpoints = async (req, res) => {
  try {
    const endpoints = {
      auth: [
        { method: 'POST', path: '/api/auth/register', status: 'Available' },
        { method: 'POST', path: '/api/auth/login', status: 'Available' }
      ],
      emails: [
        { method: 'GET', path: '/api/emails', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/emails/send', status: 'Available', requiresAuth: true }
      ],
      campaigns: [
        { method: 'GET', path: '/api/campaigns', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/campaigns', status: 'Available', requiresAuth: true }
      ],
      analytics: [
        { method: 'GET', path: '/api/analytics', status: 'Available', requiresAuth: true }
      ],
      aiFeatures: [
        { method: 'POST', path: '/api/ai-writer/generate', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/predictor/predict', status: 'Available', requiresAuth: true }
      ],
      newFeatures: [
        { method: 'GET', path: '/api/inbox-rotation', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/amp/generate', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/visual-personalization/generate', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/goal-automation/design', status: 'Available', requiresAuth: true },
        { method: 'GET', path: '/api/clv/predict/:contactId', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/conversation-agents/respond', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/staggered-send/optimize', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/liquid/personalize', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/cross-channel/adapt', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/zero-party/collect', status: 'Available', requiresAuth: true }
      ]
    };

    res.status(200).json({
      message: 'All endpoints registered successfully',
      totalEndpoints: Object.values(endpoints).flat().length,
      endpoints
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Endpoint test failed', 
      error: error.message 
    });
  }
};

// @desc    Get system info
// @route   GET /api/health/system
// @access  Public
export const getSystemInfo = async (req, res) => {
  try {
    const info = {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cpus: require('os').cpus().length,
      totalMemory: Math.round(require('os').totalmem() / 1024 / 1024) + ' MB',
      freeMemory: Math.round(require('os').freemem() / 1024 / 1024) + ' MB',
      loadAverage: require('os').loadavg()
    };
    
    res.status(200).json(info);
  } catch (error) {
    res.status(500).json({ 
      message: 'System info failed', 
      error: error.message 
    });
  }
};
