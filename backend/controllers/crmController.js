import asyncHandler from 'express-async-handler';
import CRMIntegration from '../models/CRMIntegration.js';
import { getEnvVar } from '../utils/envManager.js';

// @desc    Connect CRM
// @route   POST /api/crm/connect
// @access  Private
const connectCRM = asyncHandler(async (req, res) => {
  const { provider, name, credentials, settings } = req.body;
  const userId = req.user._id;

  // Validate credentials based on provider
  const isValid = await validateCredentials(provider, credentials);
  if (!isValid) {
    res.status(400);
    throw new Error('Invalid credentials');
  }

  const integration = await CRMIntegration.create({
    user: userId,
    provider,
    name,
    credentials,
    settings,
    status: 'connected'
  });

  res.status(201).json(integration);
});

// @desc    Get CRM integrations
// @route   GET /api/crm/integrations
// @access  Private
const getCRMIntegrations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const integrations = await CRMIntegration.find({ user: userId });
  res.json(integrations);
});

// @desc    Sync with CRM
// @route   POST /api/crm/:id/sync
// @access  Private
const syncCRM = asyncHandler(async (req, res) => {
  const integration = await CRMIntegration.findById(req.params.id);
  if (!integration) {
    res.status(404);
    throw new Error('CRM integration not found');
  }

  integration.status = 'syncing';
  await integration.save();

  // Perform sync in background
  performCRMSync(integration);

  res.json({ message: 'Sync initiated', integration });
});

// @desc    Get sync status
// @route   GET /api/crm/:id/status
// @access  Private
const getSyncStatus = asyncHandler(async (req, res) => {
  const integration = await CRMIntegration.findById(req.params.id);
  if (!integration) {
    res.status(404);
    throw new Error('CRM integration not found');
  }

  res.json({
    status: integration.status,
    lastSync: integration.lastSync,
    syncStats: integration.syncStats,
    errorMessage: integration.errorMessage
  });
});

// @desc    Disconnect CRM
// @route   DELETE /api/crm/:id
// @access  Private
const disconnectCRM = asyncHandler(async (req, res) => {
  const integration = await CRMIntegration.findById(req.params.id);
  if (!integration) {
    res.status(404);
    throw new Error('CRM integration not found');
  }

  await integration.remove();
  res.json({ message: 'CRM integration disconnected' });
});

// Helper functions
const validateCredentials = async (provider, credentials) => {
  try {
    switch (provider) {
      case 'hubspot':
        return await validateHubSpot(credentials);
      case 'salesforce':
        return await validateSalesforce(credentials);
      case 'pipedrive':
        return await validatePipedrive(credentials);
      default:
        return false;
    }
  } catch (error) {
    console.error('Credential validation error:', error);
    return false;
  }
};

const validateHubSpot = async (credentials) => {
  // Implementation would validate HubSpot API key
  return true; // Placeholder
};

const validateSalesforce = async (credentials) => {
  // Implementation would validate Salesforce credentials
  return true; // Placeholder
};

const validatePipedrive = async (credentials) => {
  // Implementation would validate Pipedrive API token
  return true; // Placeholder
};

const performCRMSync = async (integration) => {
  try {
    const startTime = Date.now();

    switch (integration.provider) {
      case 'hubspot':
        await syncWithHubSpot(integration);
        break;
      case 'salesforce':
        await syncWithSalesforce(integration);
        break;
      case 'pipedrive':
        await syncWithPipedrive(integration);
        break;
    }

    integration.status = 'connected';
    integration.lastSync = new Date();
    integration.syncStats.lastSyncDuration = Date.now() - startTime;
    await integration.save();

  } catch (error) {
    integration.status = 'error';
    integration.errorMessage = error.message;
    await integration.save();
  }
};

const syncWithHubSpot = async (integration) => {
  // Implementation would sync contacts, deals, etc.
  integration.syncStats.contactsSynced = 150;
  integration.syncStats.dealsSynced = 25;
};

const syncWithSalesforce = async (integration) => {
  // Implementation would sync with Salesforce
  integration.syncStats.contactsSynced = 200;
  integration.syncStats.dealsSynced = 45;
};

const syncWithPipedrive = async (integration) => {
  // Implementation would sync with Pipedrive
  integration.syncStats.contactsSynced = 100;
  integration.syncStats.dealsSynced = 30;
};

export {
  connectCRM,
  getCRMIntegrations,
  syncCRM,
  getSyncStatus,
  disconnectCRM
};
