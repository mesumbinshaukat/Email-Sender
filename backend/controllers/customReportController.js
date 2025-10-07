import asyncHandler from 'express-async-handler';
import CustomReport from '../models/CustomReport.js';
import Email from '../models/Email.js';
import Campaign from '../models/Campaign.js';
import Contact from '../models/Contact.js';

// @desc    Create custom report
// @route   POST /api/reports
// @access  Private
const createReport = asyncHandler(async (req, res) => {
  const { name, description, type, config, schedule } = req.body;
  const userId = req.user._id;

  const report = await CustomReport.create({
    user: userId,
    name,
    description,
    type,
    config,
    schedule
  });

  res.status(201).json(report);
});

// @desc    Get user's reports
// @route   GET /api/reports
// @access  Private
const getReports = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const reports = await CustomReport.find({ user: userId }).sort({ createdAt: -1 });
  res.json(reports);
});

// @desc    Generate report data
// @route   POST /api/reports/:id/generate
// @access  Private
const generateReport = asyncHandler(async (req, res) => {
  const report = await CustomReport.findById(req.params.id);

  if (!report) {
    res.status(404);
    throw new Error('Report not found');
  }

  if (report.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  const data = await generateReportData(report);
  report.data = data;
  report.lastGenerated = new Date();
  await report.save();

  res.json({ report, data });
});

// @desc    Get report data
// @route   GET /api/reports/:id/data
// @access  Private
const getReportData = asyncHandler(async (req, res) => {
  const report = await CustomReport.findById(req.params.id);

  if (!report) {
    res.status(404);
    throw new Error('Report not found');
  }

  if (report.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  res.json({
    report,
    data: report.data,
    lastGenerated: report.lastGenerated
  });
});

// @desc    Update report
// @route   PUT /api/reports/:id
// @access  Private
const updateReport = asyncHandler(async (req, res) => {
  const report = await CustomReport.findById(req.params.id);

  if (!report) {
    res.status(404);
    throw new Error('Report not found');
  }

  if (report.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  const updates = req.body;
  Object.assign(report, updates);
  await report.save();

  res.json(report);
});

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private
const deleteReport = asyncHandler(async (req, res) => {
  const report = await CustomReport.findById(req.params.id);

  if (!report) {
    res.status(404);
    throw new Error('Report not found');
  }

  if (report.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  await CustomReport.findByIdAndDelete(req.params.id);
  res.json({ message: 'Report deleted' });
});

// @desc    Get dashboard metrics
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboardMetrics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get date range (default last 30 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const [
    totalEmails,
    sentEmails,
    openedEmails,
    clickedEmails,
    totalContacts,
    activeCampaigns
  ] = await Promise.all([
    Email.countDocuments({ user: userId }),
    Email.countDocuments({ user: userId, createdAt: { $gte: startDate } }),
    Email.countDocuments({ user: userId, openedAt: { $ne: null }, createdAt: { $gte: startDate } }),
    Email.countDocuments({ user: userId, clickedAt: { $ne: null }, createdAt: { $gte: startDate } }),
    Contact.countDocuments({ user: userId }),
    Campaign.countDocuments({ user: userId, status: 'active' })
  ]);

  const openRate = sentEmails > 0 ? (openedEmails / sentEmails) * 100 : 0;
  const clickRate = sentEmails > 0 ? (clickedEmails / sentEmails) * 100 : 0;

  const metrics = {
    overview: {
      totalEmails,
      sentEmails,
      totalContacts,
      activeCampaigns
    },
    performance: {
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
      openedEmails,
      clickedEmails
    },
    trends: await getTrendsData(userId, startDate, endDate)
  };

  res.json(metrics);
});

// Helper functions
const generateReportData = async (report) => {
  const { type, config } = report;
  const userId = report.user;

  // Set date range
  let startDate, endDate;
  if (config.dateRange) {
    startDate = config.dateRange.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    endDate = config.dateRange.end || new Date();
  } else {
    endDate = new Date();
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  switch (type) {
    case 'email_performance':
      return await generateEmailPerformanceReport(userId, startDate, endDate, config);
    case 'campaign_analysis':
      return await generateCampaignAnalysisReport(userId, startDate, endDate, config);
    case 'contact_segmentation':
      return await generateContactSegmentationReport(userId, config);
    case 'revenue_tracking':
      return await generateRevenueTrackingReport(userId, startDate, endDate, config);
    default:
      return { message: 'Custom report type not yet implemented' };
  }
};

const generateEmailPerformanceReport = async (userId, startDate, endDate, config) => {
  const emails = await Email.find({
    user: userId,
    createdAt: { $gte: startDate, $lte: endDate }
  }).populate('contact campaign');

  const total = emails.length;
  const sent = emails.filter(e => e.status === 'sent').length;
  const opened = emails.filter(e => e.openedAt).length;
  const clicked = emails.filter(e => e.clickedAt).length;
  const bounced = emails.filter(e => e.status === 'bounced').length;

  return {
    summary: {
      total,
      sent,
      opened,
      clicked,
      bounced,
      openRate: total > 0 ? Math.round((opened / total) * 100) : 0,
      clickRate: total > 0 ? Math.round((clicked / total) * 100) : 0,
      bounceRate: total > 0 ? Math.round((bounced / total) * 100) : 0
    },
    data: emails.map(email => ({
      id: email._id,
      subject: email.subject,
      sentAt: email.createdAt,
      opened: !!email.openedAt,
      clicked: !!email.clickedAt,
      status: email.status,
      contact: email.contact?.email
    }))
  };
};

const generateCampaignAnalysisReport = async (userId, startDate, endDate, config) => {
  const campaigns = await Campaign.find({
    user: userId,
    createdAt: { $gte: startDate, $lte: endDate }
  });

  const campaignData = await Promise.all(
    campaigns.map(async (campaign) => {
      const emails = await Email.find({ campaign: campaign._id });
      const sent = emails.length;
      const opened = emails.filter(e => e.openedAt).length;
      const clicked = emails.filter(e => e.clickedAt).length;

      return {
        id: campaign._id,
        name: campaign.name,
        status: campaign.status,
        sent,
        opened,
        clicked,
        openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
        clickRate: sent > 0 ? Math.round((clicked / sent) * 100) : 0
      };
    })
  );

  return {
    campaigns: campaignData,
    summary: {
      total: campaigns.length,
      active: campaigns.filter(c => c.status === 'active').length,
      completed: campaigns.filter(c => c.status === 'completed').length
    }
  };
};

const generateContactSegmentationReport = async (userId, config) => {
  const contacts = await Contact.find({ user: userId });

  const segments = {
    active: contacts.filter(c => c.lastActivity && new Date(c.lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
    inactive: contacts.filter(c => !c.lastActivity || new Date(c.lastActivity) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
    new: contacts.filter(c => new Date(c.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
    engaged: contacts.filter(c => c.tags && c.tags.includes('engaged')).length
  };

  return {
    totalContacts: contacts.length,
    segments,
    distribution: Object.entries(segments).map(([segment, count]) => ({
      segment,
      count,
      percentage: Math.round((count / contacts.length) * 100)
    }))
  };
};

const generateRevenueTrackingReport = async (userId, startDate, endDate, config) => {
  // This would integrate with e-commerce data
  // For now, return mock data
  return {
    totalRevenue: 0,
    conversions: 0,
    averageOrderValue: 0,
    attribution: {
      email: 0,
      social: 0,
      direct: 0,
      other: 0
    }
  };
};

const getTrendsData = async (userId, startDate, endDate) => {
  const days = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayStart = new Date(current);
    const dayEnd = new Date(current);
    dayEnd.setHours(23, 59, 59, 999);

    const sent = await Email.countDocuments({
      user: userId,
      createdAt: { $gte: dayStart, $lte: dayEnd }
    });

    const opened = await Email.countDocuments({
      user: userId,
      openedAt: { $gte: dayStart, $lte: dayEnd }
    });

    days.push({
      date: current.toISOString().split('T')[0],
      sent,
      opened,
      openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0
    });

    current.setDate(current.getDate() + 1);
  }

  return days;
};

export {
  createReport,
  getReports,
  generateReport,
  getReportData,
  updateReport,
  deleteReport,
  getDashboardMetrics
};
