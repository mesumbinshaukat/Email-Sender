// express-async-handler removed - using native async/await
import Alert from '../models/Alert.js';
import { getEnvVar } from '../utils/envManager.js';

// @desc    Create alert
// @route   POST /api/alerts/create
// @access  Private
const createAlert = asyncHandler(async (req, res) => {
  const { type, title, message, severity, channels, triggers } = req.body;
  const userId = req.user._id;

  const alert = await Alert.create({
    user: userId,
    type,
    title,
    message,
    severity,
    channels,
    triggers,
    status: 'active'
  });

  // Send immediate notification if channels specified
  if (channels && channels.length > 0) {
    await sendAlertNotification(alert);
  }

  res.status(201).json(alert);
});

// @desc    Get alerts
// @route   GET /api/alerts
// @access  Private
const getAlerts = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, type } = req.query;

  const query = { user: userId };
  if (status) query.status = status;
  if (type) query.type = type;

  const alerts = await Alert.find(query).sort({ createdAt: -1 });
  res.json(alerts);
});

// @desc    Update alert status
// @route   PUT /api/alerts/:id/status
// @access  Private
const updateAlertStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const alert = await Alert.findById(req.params.id);

  if (!alert) {
    res.status(404);
    throw new Error('Alert not found');
  }

  alert.status = status;
  await alert.save();
  res.json(alert);
});

// @desc    Trigger alert (internal use)
// @route   POST /api/alerts/trigger
// @access  Private
const triggerAlert = asyncHandler(async (req, res) => {
  const { type, data, userId } = req.body;

  // Find matching alert templates
  const alertTemplates = await Alert.find({
    user: userId,
    type,
    isActive: true
  });

  const triggeredAlerts = [];

  for (const template of alertTemplates) {
    // Check if conditions are met
    if (checkAlertCondition(template, data)) {
      const alert = await Alert.create({
        user: userId,
        type: template.type,
        title: template.title,
        message: template.message,
        severity: template.severity,
        channels: template.channels,
        data
      });

      await sendAlertNotification(alert);
      triggeredAlerts.push(alert);
    }
  }

  res.json({ triggered: triggeredAlerts.length, alerts: triggeredAlerts });
});

// @desc    Send test alert
// @route   POST /api/alerts/test
// @access  Private
const sendTestAlert = asyncHandler(async (req, res) => {
  const { channels } = req.body;
  const userId = req.user._id;

  const testAlert = {
    user: userId,
    type: 'system_test',
    title: 'Test Alert',
    message: 'This is a test alert to verify your notification channels.',
    severity: 'low',
    channels,
    data: { test: true }
  };

  await sendAlertNotification(testAlert);
  res.json({ message: 'Test alert sent' });
});

// Helper functions
const checkAlertCondition = (template, data) => {
  if (!template.triggers) return true;

  const { threshold, condition } = template.triggers;

  switch (condition) {
    case 'greater_than':
      return data.value > threshold;
    case 'less_than':
      return data.value < threshold;
    case 'equals':
      return data.value === threshold;
    default:
      return true;
  }
};

const sendAlertNotification = async (alert) => {
  const channels = alert.channels || [];

  for (const channel of channels) {
    switch (channel) {
      case 'email':
        await sendEmailAlert(alert);
        break;
      case 'slack':
        await sendSlackAlert(alert);
        break;
      case 'webhook':
        await sendWebhookAlert(alert);
        break;
      case 'sms':
        await sendSMSAlert(alert);
        break;
    }
  }
};

const sendEmailAlert = async (alert) => {
  // Implementation would send email
  console.log('Sending email alert:', alert.title);
};

const sendSlackAlert = async (alert) => {
  const slackToken = await getEnvVar('SLACK_BOT_TOKEN');
  // Implementation would send to Slack
  console.log('Sending Slack alert:', alert.title);
};

const sendWebhookAlert = async (alert) => {
  // Implementation would send to webhook URL
  console.log('Sending webhook alert:', alert.title);
};

const sendSMSAlert = async (alert) => {
  // Implementation would send SMS
  console.log('Sending SMS alert:', alert.title);
};

export {
  createAlert,
  getAlerts,
  updateAlertStatus,
  triggerAlert,
  sendTestAlert
};
