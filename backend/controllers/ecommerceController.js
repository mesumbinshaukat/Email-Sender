import asyncHandler from 'express-async-handler';
import EcommerceIntegration from '../models/EcommerceIntegration.js';

// @desc    Connect e-commerce platform
// @route   POST /api/ecommerce/connect
// @access  Private
const connectEcommerce = asyncHandler(async (req, res) => {
  const { platform, storeName, credentials, settings } = req.body;
  const userId = req.user._id;

  const integration = await EcommerceIntegration.create({
    user: userId,
    platform,
    storeName,
    credentials,
    settings,
    status: 'connected'
  });

  // Setup webhooks
  await setupWebhooks(integration);

  res.status(201).json(integration);
});

// @desc    Get e-commerce integrations
// @route   GET /api/ecommerce/integrations
// @access  Private
const getEcommerceIntegrations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const integrations = await EcommerceIntegration.find({ user: userId });
  res.json(integrations);
});

// @desc    Sync with e-commerce platform
// @route   POST /api/ecommerce/:id/sync
// @access  Private
const syncEcommerce = asyncHandler(async (req, res) => {
  const integration = await EcommerceIntegration.findById(req.params.id);
  if (!integration) {
    res.status(404);
    throw new Error('E-commerce integration not found');
  }

  integration.status = 'syncing';
  await integration.save();

  // Perform sync
  await performEcommerceSync(integration);

  integration.status = 'connected';
  integration.lastSync = new Date();
  await integration.save();

  res.json(integration);
});

// @desc    Handle webhook events
// @route   POST /api/ecommerce/webhook/:platform
// @access  Public (webhook)
const handleWebhook = asyncHandler(async (req, res) => {
  const { platform } = req.params;
  const eventData = req.body;

  // Find integration by webhook secret or store URL
  const integration = await EcommerceIntegration.findOne({
    platform,
    'credentials.webhookSecret': req.headers['x-webhook-secret']
  });

  if (!integration) {
    res.status(404);
    throw new Error('Integration not found');
  }

  // Process webhook event
  await processWebhookEvent(integration, eventData);

  res.json({ received: true });
});

// Helper functions
const setupWebhooks = async (integration) => {
  const webhooks = [
    { event: 'order.created', url: `${process.env.BASE_URL}/api/ecommerce/webhook/${integration.platform}` },
    { event: 'cart.abandoned', url: `${process.env.BASE_URL}/api/ecommerce/webhook/${integration.platform}` },
    { event: 'customer.created', url: `${process.env.BASE_URL}/api/ecommerce/webhook/${integration.platform}` }
  ];

  integration.webhooks = webhooks;
  await integration.save();
};

const performEcommerceSync = async (integration) => {
  switch (integration.platform) {
    case 'shopify':
      await syncShopify(integration);
      break;
    case 'woocommerce':
      await syncWooCommerce(integration);
      break;
  }
};

const syncShopify = async (integration) => {
  // Implementation would sync with Shopify API
  integration.syncStats.ordersSynced = 50;
  integration.syncStats.productsSynced = 200;
  integration.syncStats.customersSynced = 150;
};

const syncWooCommerce = async (integration) => {
  // Implementation would sync with WooCommerce API
  integration.syncStats.ordersSynced = 30;
  integration.syncStats.productsSynced = 150;
  integration.syncStats.customersSynced = 100;
};

const processWebhookEvent = async (integration, eventData) => {
  switch (eventData.event) {
    case 'order.created':
      // Send order confirmation email
      break;
    case 'cart.abandoned':
      // Send abandoned cart email
      break;
    case 'customer.created':
      // Send welcome email
      break;
  }
};

export {
  connectEcommerce,
  getEcommerceIntegrations,
  syncEcommerce,
  handleWebhook
};
