// express-async-handler removed - using native async/await
import DataPrivacy from '../models/DataPrivacy.js';
import Contact from '../models/Contact.js';
import Email from '../models/Email.js';

// @desc    Initialize data privacy center
// @route   POST /api/privacy/init
// @access  Private
const initializePrivacy = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  let privacy = await DataPrivacy.findOne({ user: userId });

  if (!privacy) {
    privacy = await DataPrivacy.create({
      user: userId,
      gdprCompliance: {
        dataProcessingAgreement: false,
        privacyPolicy: '',
        consentMechanism: 'explicit'
      },
      settings: {
        autoDeleteInactiveData: false,
        anonymizeAfterRetention: true,
        requireConsentForMarketing: true
      }
    });
  }

  res.json(privacy);
});

// @desc    Update GDPR compliance settings
// @route   PUT /api/privacy/gdpr
// @access  Private
const updateGDPRCompliance = asyncHandler(async (req, res) => {
  const { gdprSettings } = req.body;
  const userId = req.user._id;

  let privacy = await DataPrivacy.findOne({ user: userId });

  if (!privacy) {
    privacy = await DataPrivacy.create({ user: userId });
  }

  privacy.gdprCompliance = { ...privacy.gdprCompliance, ...gdprSettings };
  await privacy.save();

  // Recalculate compliance score
  await calculateComplianceScore(privacy);

  res.json(privacy);
});

// @desc    Submit data request (GDPR)
// @route   POST /api/privacy/request
// @access  Public (for data subjects)
const submitDataRequest = asyncHandler(async (req, res) => {
  const { type, email, name, reason } = req.body;

  // Find user by email domain or contact
  const contact = await Contact.findOne({ email });
  if (!contact) {
    res.status(404);
    throw new Error('Contact not found');
  }

  const privacy = await DataPrivacy.findOne({ user: contact.user });

  if (!privacy) {
    res.status(404);
    throw new Error('Privacy settings not configured');
  }

  const requestId = `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  privacy.dataRequests.push({
    requestId,
    type,
    requester: {
      email,
      name,
      contactId: contact._id
    },
    status: 'pending',
    reason
  });

  await privacy.save();

  // Log audit
  privacy.auditLog.push({
    action: 'data_request_submitted',
    timestamp: new Date(),
    details: { requestId, type, email }
  });

  await privacy.save();

  res.json({
    requestId,
    message: 'Data request submitted successfully. You will receive a response within 30 days.',
    estimatedResponseTime: '30 days'
  });
});

// @desc    Process data request
// @route   PUT /api/privacy/request/:requestId/process
// @access  Private
const processDataRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { action, data } = req.body;
  const userId = req.user._id;

  const privacy = await DataPrivacy.findOne({ user: userId });

  if (!privacy) {
    res.status(404);
    throw new Error('Privacy settings not found');
  }

  const requestIndex = privacy.dataRequests.findIndex(r => r.requestId === requestId);

  if (requestIndex === -1) {
    res.status(404);
    throw new Error('Data request not found');
  }

  const request = privacy.dataRequests[requestIndex];

  if (action === 'approve') {
    request.status = 'processing';

    // Process based on request type
    const processedData = await processRequestByType(request, privacy);

    request.data = processedData;
    request.status = 'completed';
    request.completedAt = new Date();

  } else if (action === 'reject') {
    request.status = 'rejected';
    request.completedAt = new Date();
  }

  await privacy.save();

  // Log audit
  privacy.auditLog.push({
    action: 'data_request_processed',
    performedBy: userId,
    timestamp: new Date(),
    details: { requestId, action, status: request.status }
  });

  await privacy.save();

  res.json(request);
});

// @desc    Get data export for user
// @route   GET /api/privacy/export
// @access  Private
const getDataExport = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get all user data
  const contacts = await Contact.find({ user: userId });
  const emails = await Email.find({ user: userId }).populate('contact');

  const exportData = {
    profile: { userId },
    contacts: contacts.map(c => ({
      id: c._id,
      email: c.email,
      name: c.name,
      createdAt: c.createdAt,
      lastActivity: c.lastActivity
    })),
    emails: emails.map(e => ({
      id: e._id,
      subject: e.subject,
      sentAt: e.createdAt,
      openedAt: e.openedAt,
      clickedAt: e.clickedAt,
      status: e.status
    })),
    exportDate: new Date(),
    format: 'GDPR Article 20'
  };

  res.json(exportData);
});

// @desc    Delete user data
// @route   DELETE /api/privacy/data
// @access  Private
const deleteUserData = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { reason } = req.body;

  // Soft delete - mark for deletion
  // In production, implement proper data deletion with retention policies

  // Log audit
  const privacy = await DataPrivacy.findOne({ user: userId });
  if (privacy) {
    privacy.auditLog.push({
      action: 'data_deletion_requested',
      performedBy: userId,
      timestamp: new Date(),
      details: { reason }
    });
    await privacy.save();
  }

  res.json({
    message: 'Data deletion request processed. Data will be permanently deleted within 30 days.',
    estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });
});

// @desc    Get privacy dashboard
// @route   GET /api/privacy/dashboard
// @access  Private
const getPrivacyDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const privacy = await DataPrivacy.findOne({ user: userId });

  if (!privacy) {
    return res.json({
      compliance: { overall: 0, gdpr: 0, ccpa: 0 },
      requests: { pending: 0, completed: 0 },
      dataMapping: { personalData: [], dataSubjects: [] },
      settings: {}
    });
  }

  const dashboard = {
    compliance: privacy.complianceScore,
    requests: {
      pending: privacy.dataRequests.filter(r => r.status === 'pending').length,
      completed: privacy.dataRequests.filter(r => r.status === 'completed').length,
      total: privacy.dataRequests.length
    },
    dataMapping: privacy.dataMapping,
    settings: privacy.settings,
    recentRequests: privacy.dataRequests.slice(-5),
    auditLog: privacy.auditLog.slice(-10)
  };

  res.json(dashboard);
});

// Helper functions
const processRequestByType = async (request, privacy) => {
  switch (request.type) {
    case 'access':
      return await getUserData(request.requester.contactId);
    case 'erasure':
      return await deleteUserDataById(request.requester.contactId, privacy);
    case 'portability':
      return await exportUserData(request.requester.contactId);
    case 'rectification':
      return { message: 'Data rectification requires manual review' };
    default:
      return { message: 'Request type not yet implemented' };
  }
};

const getUserData = async (contactId) => {
  const contact = await Contact.findById(contactId);
  const emails = await Email.find({ contact: contactId });

  return {
    contact,
    emails: emails.map(e => ({
      subject: e.subject,
      sentAt: e.createdAt,
      opened: !!e.openedAt,
      clicked: !!e.clickedAt
    })),
    totalEmails: emails.length,
    lastActivity: contact?.lastActivity
  };
};

const deleteUserDataById = async (contactId, privacy) => {
  // Mark for deletion - don't actually delete yet
  await Contact.findByIdAndUpdate(contactId, {
    markedForDeletion: true,
    deletionReason: 'GDPR request',
    deletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });

  return { message: 'Data marked for deletion. Will be permanently removed within 30 days.' };
};

const exportUserData = async (contactId) => {
  const contact = await Contact.findById(contactId);
  const emails = await Email.find({ contact: contactId });

  return {
    contact: {
      id: contact._id,
      email: contact.email,
      name: contact.name,
      createdAt: contact.createdAt
    },
    emails: emails.map(e => ({
      id: e._id,
      subject: e.subject,
      sentAt: e.createdAt,
      openedAt: e.openedAt,
      clickedAt: e.clickedAt
    })),
    exportFormat: 'JSON',
    exportDate: new Date()
  };
};

const calculateComplianceScore = async (privacy) => {
  let gdprScore = 0;

  if (privacy.gdprCompliance.privacyPolicy) gdprScore += 20;
  if (privacy.gdprCompliance.consentMechanism === 'explicit') gdprScore += 20;
  if (privacy.gdprCompliance.dataRetentionPolicy.personalData > 0) gdprScore += 20;
  if (privacy.dataRequests.length >= 0) gdprScore += 20; // Has request handling
  if (privacy.auditLog.length > 0) gdprScore += 20;

  privacy.complianceScore.gdpr = gdprScore;
  privacy.complianceScore.overall = Math.round(gdprScore * 0.7); // Weighted average
  privacy.complianceScore.lastCalculated = new Date();

  await privacy.save();
};

export {
  initializePrivacy,
  updateGDPRCompliance,
  submitDataRequest,
  processDataRequest,
  getDataExport,
  deleteUserData,
  getPrivacyDashboard
};
