import asyncHandler from 'express-async-handler';
import Attribution from '../models/Attribution.js';

// @desc    Track touchpoint
// @route   POST /api/attribution/track
// @access  Private
const trackTouchpoint = asyncHandler(async (req, res) => {
  const { contactId, type, emailId, value, source } = req.body;
  const userId = req.user._id;

  let attribution = await Attribution.findOne({ contact: contactId, user: userId });
  if (!attribution) {
    attribution = await Attribution.create({
      user: userId,
      contact: contactId
    });
  }

  attribution.touchpoints.push({
    type,
    timestamp: new Date(),
    email: emailId,
    value: value || 0,
    source
  });

  attribution.customerJourney.push({
    stage: getJourneyStage(type),
    timestamp: new Date(),
    action: type,
    details: { emailId, source }
  });

  await attribution.save();
  res.json(attribution);
});

// @desc    Record conversion
// @route   POST /api/attribution/conversion
// @access  Private
const recordConversion = asyncHandler(async (req, res) => {
  const { contactId, value, type } = req.body;
  const userId = req.user._id;

  const attribution = await Attribution.findOne({ contact: contactId, user: userId });
  if (!attribution) {
    res.status(404);
    throw new Error('Attribution record not found');
  }

  attribution.conversion = {
    occurred: true,
    timestamp: new Date(),
    value,
    type
  };

  // Apply attribution model
  await applyAttributionModel(attribution);

  res.json(attribution);
});

// @desc    Get attribution report
// @route   GET /api/attribution/report
// @access  Private
const getAttributionReport = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { startDate, endDate, model } = req.query;

  const query = { user: userId };
  if (startDate && endDate) {
    query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const attributions = await Attribution.find(query).populate('contact campaign');

  const report = {
    totalConversions: attributions.filter(a => a.conversion.occurred).length,
    totalRevenue: attributions.reduce((sum, a) => sum + (a.totalRevenue || 0), 0),
    attributionBreakdown: {
      first_touch: 0,
      last_touch: 0,
      linear: 0,
      time_decay: 0
    },
    topChannels: {},
    customerJourneys: attributions.slice(0, 10) // Sample journeys
  };

  attributions.forEach(attribution => {
    if (attribution.attributionModel) {
      report.attributionBreakdown[attribution.attributionModel]++;
    }

    // Count channels
    attribution.touchpoints.forEach(tp => {
      report.topChannels[tp.type] = (report.topChannels[tp.type] || 0) + 1;
    });
  });

  res.json(report);
});

// @desc    Get customer journey
// @route   GET /api/attribution/journey/:contactId
// @access  Private
const getCustomerJourney = asyncHandler(async (req, res) => {
  const { contactId } = req.params;
  const userId = req.user._id;

  const attribution = await Attribution.findOne({ contact: contactId, user: userId })
    .populate('contact touchpoints.email');

  if (!attribution) {
    res.status(404);
    throw new Error('Attribution record not found');
  }

  res.json(attribution);
});

// Helper functions
const getJourneyStage = (type) => {
  const stages = {
    email_open: 'Awareness',
    email_click: 'Interest',
    website_visit: 'Consideration',
    form_submit: 'Intent',
    purchase: 'Purchase'
  };
  return stages[type] || 'Unknown';
};

const applyAttributionModel = async (attribution) => {
  const touchpoints = attribution.touchpoints;
  const totalValue = attribution.conversion.value;

  switch (attribution.attributionModel) {
    case 'first_touch':
      if (touchpoints.length > 0) {
        touchpoints[0].value = totalValue;
      }
      break;
    case 'last_touch':
      if (touchpoints.length > 0) {
        touchpoints[touchpoints.length - 1].value = totalValue;
      }
      break;
    case 'linear':
      const valuePerTouch = totalValue / touchpoints.length;
      touchpoints.forEach(tp => tp.value = valuePerTouch);
      break;
    case 'time_decay':
      // More recent touchpoints get more credit
      const totalWeight = touchpoints.reduce((sum, _, index) => sum + (index + 1), 0);
      touchpoints.forEach((tp, index) => {
        tp.value = totalValue * (index + 1) / totalWeight;
      });
      break;
  }

  attribution.totalRevenue = totalValue;
  await attribution.save();
};

export {
  trackTouchpoint,
  recordConversion,
  getAttributionReport,
  getCustomerJourney
};
