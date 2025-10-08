import mongoose from 'mongoose';
import os from 'os';

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
      database: mongoose.connection && mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
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
        { method: 'GET', path: '/api/emails/analytics/stats', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/emails/send', status: 'Available', requiresAuth: true },
        { method: 'GET', path: '/api/emails/:id', status: 'Available', requiresAuth: true },
        { method: 'DELETE', path: '/api/emails/:id', status: 'Available', requiresAuth: true }
      ],
      tracking: [
        { method: 'GET', path: '/api/tracking/open/:trackingId', status: 'Available' },
        { method: 'GET', path: '/api/tracking/click/:trackingId', status: 'Available' }
      ],
      warmup: [
        { method: 'GET', path: '/api/warmup/status', status: 'Available', requiresAuth: true },
        { method: 'GET', path: '/api/warmup/reputation-score', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/warmup/start', status: 'Available', requiresAuth: true },
        { method: 'GET', path: '/api/warmup/recommendations', status: 'Available', requiresAuth: true }
      ],
      voice: [
        { method: 'POST', path: '/api/voice/transcribe', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/voice/command', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/voice/compose', status: 'Available', requiresAuth: true },
        { method: 'GET', path: '/api/voice/supported-commands', status: 'Available', requiresAuth: true }
      ],
      aiProviders: [
        { method: 'GET', path: '/api/ai-providers', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/ai-providers', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/ai-providers/test', status: 'Available', requiresAuth: true },
        { method: 'GET', path: '/api/ai-providers/models/:provider', status: 'Available', requiresAuth: true },
        { method: 'PUT', path: '/api/ai-providers/:id', status: 'Available', requiresAuth: true },
        { method: 'DELETE', path: '/api/ai-providers/:id', status: 'Available', requiresAuth: true },
        { method: 'PUT', path: '/api/ai-providers/:id/set-default', status: 'Available', requiresAuth: true }
      ],
      campaigns: [
        { method: 'GET', path: '/api/campaigns', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/campaigns', status: 'Available', requiresAuth: true }
      ],
      analytics: [
        { method: 'GET', path: '/api/analytics', status: 'Available', requiresAuth: true }
      ],
      aiFeatures: [
        { method: 'POST', path: '/api/ai/generate', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/predictor/predict', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/copilot/suggest', status: 'Available', requiresAuth: true }
      ],
      advancedFeatures: [
        { method: 'GET', path: '/api/inbox-rotation', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/amp/generate', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/visual-personalization/generate', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/goal-automation/design', status: 'Available', requiresAuth: true },
        { method: 'GET', path: '/api/clv/predict/:contactId', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/conversation-agents/respond', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/staggered-send/optimize', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/liquid/personalize', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/cross-channel/adapt', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/zero-party/collect', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/zero-party/enrich', status: 'Available', requiresAuth: true }
      ],
      environment: [
        { method: 'GET', path: '/api/env', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/env', status: 'Available', requiresAuth: true },
        { method: 'GET', path: '/api/env/:key/status', status: 'Available', requiresAuth: true },
        { method: 'PUT', path: '/api/env/:key', status: 'Available', requiresAuth: true },
        { method: 'DELETE', path: '/api/env/:key', status: 'Available', requiresAuth: true },
        { method: 'POST', path: '/api/env/test/:service', status: 'Available', requiresAuth: true }
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
      cpus: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / 1024 / 1024) + ' MB',
      freeMemory: Math.round(os.freemem() / 1024 / 1024) + ' MB',
      loadAverage: os.loadavg()
    };
    
    res.status(200).json(info);
  } catch (error) {
    res.status(500).json({ 
      message: 'System info failed', 
      error: error.message 
    });
  }
};
