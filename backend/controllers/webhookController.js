import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import Webhook from '../models/Webhook.js';
import { getEnvVar } from '../utils/envManager.js';

// @desc    Create webhook
// @route   POST /api/webhooks
// @access  Private
const createWebhook = asyncHandler(async (req, res) => {
  const { name, url, events, headers } = req.body;
  const userId = req.user._id;

  // Generate webhook secret
  const secret = crypto.randomBytes(32).toString('hex');

  const webhook = await Webhook.create({
    user: userId,
    name,
    url,
    events,
    secret,
    headers: headers || {}
  });

  res.status(201).json({
    webhook,
    secret // Only shown once for security
  });
});

// @desc    Get user's webhooks
// @route   GET /api/webhooks
// @access  Private
const getWebhooks = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const webhooks = await Webhook.find({ user: userId }).select('-secret');
  res.json(webhooks);
});

// @desc    Update webhook
// @route   PUT /api/webhooks/:id
// @access  Private
const updateWebhook = asyncHandler(async (req, res) => {
  const { name, url, events, headers, isActive } = req.body;

  const webhook = await Webhook.findById(req.params.id);

  if (!webhook) {
    res.status(404);
    throw new Error('Webhook not found');
  }

  if (webhook.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  webhook.name = name || webhook.name;
  webhook.url = url || webhook.url;
  webhook.events = events || webhook.events;
  webhook.headers = headers || webhook.headers;
  webhook.isActive = isActive !== undefined ? isActive : webhook.isActive;

  await webhook.save();

  res.json(webhook);
});

// @desc    Delete webhook
// @route   DELETE /api/webhooks/:id
// @access  Private
const deleteWebhook = asyncHandler(async (req, res) => {
  const webhook = await Webhook.findById(req.params.id);

  if (!webhook) {
    res.status(404);
    throw new Error('Webhook not found');
  }

  if (webhook.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  await Webhook.findByIdAndDelete(req.params.id);
  res.json({ message: 'Webhook deleted' });
});

// @desc    Test webhook
// @route   POST /api/webhooks/:id/test
// @access  Private
const testWebhook = asyncHandler(async (req, res) => {
  const webhook = await Webhook.findById(req.params.id);

  if (!webhook) {
    res.status(404);
    throw new Error('Webhook not found');
  }

  if (webhook.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  const testPayload = {
    event: 'test',
    timestamp: new Date().toISOString(),
    data: {
      message: 'This is a test webhook',
      user: req.user._id
    }
  };

  const result = await sendWebhook(webhook, testPayload);

  res.json({
    success: result.success,
    statusCode: result.statusCode,
    response: result.response
  });
});

// @desc    Trigger webhook (internal use)
// @route   POST /api/webhooks/trigger
// @access  Private/Internal
const triggerWebhook = asyncHandler(async (req, res) => {
  const { userId, event, data } = req.body;

  const webhooks = await Webhook.find({
    user: userId,
    events: event,
    isActive: true
  });

  const results = [];

  for (const webhook of webhooks) {
    const result = await sendWebhook(webhook, {
      event,
      timestamp: new Date().toISOString(),
      data
    });
    results.push({
      webhookId: webhook._id,
      success: result.success,
      statusCode: result.statusCode
    });
  }

  res.json(results);
});

// @desc    Get API documentation
// @route   GET /api/docs
// @access  Private
const getApiDocs = asyncHandler(async (req, res) => {
  const docs = {
    version: '1.0.0',
    baseUrl: process.env.API_BASE_URL || 'https://api.emailtracker.com',
    endpoints: {
      emails: {
        send: 'POST /api/emails/send',
        list: 'GET /api/emails',
        get: 'GET /api/emails/:id'
      },
      contacts: {
        create: 'POST /api/contacts',
        list: 'GET /api/contacts',
        update: 'PUT /api/contacts/:id'
      },
      campaigns: {
        create: 'POST /api/campaigns',
        list: 'GET /api/campaigns',
        start: 'POST /api/campaigns/:id/start'
      }
    },
    webhooks: {
      events: [
        'email.sent',
        'email.opened',
        'email.clicked',
        'email.bounced',
        'contact.created',
        'contact.updated',
        'campaign.created',
        'campaign.completed'
      ],
      payload: {
        event: 'string',
        timestamp: 'ISO string',
        data: 'object'
      }
    }
  };

  res.json(docs);
});

// Helper functions
const sendWebhook = async (webhook, payload) => {
  try {
    // Create signature
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-ID': webhook._id.toString(),
      'User-Agent': 'EmailTracker-Webhook/1.0',
      ...webhook.headers
    };

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      timeout: 10000 // 10 seconds
    });

    const success = response.ok;
    const statusCode = response.status;

    // Update delivery stats
    webhook.deliveryStats.total++;
    if (success) {
      webhook.deliveryStats.success++;
    } else {
      webhook.deliveryStats.failed++;
    }
    webhook.lastTriggered = new Date();
    await webhook.save();

    return {
      success,
      statusCode,
      response: success ? 'OK' : `HTTP ${statusCode}`
    };

  } catch (error) {
    console.error('Webhook delivery failed:', error);

    // Update delivery stats
    webhook.deliveryStats.total++;
    webhook.deliveryStats.failed++;
    await webhook.save();

    return {
      success: false,
      statusCode: 0,
      response: error.message
    };
  }
};

export {
  createWebhook,
  getWebhooks,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  triggerWebhook,
  getApiDocs
};
