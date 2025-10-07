import { ConversionEvent, RevenueGoal } from '../models/Revenue.js';
import Email from '../models/Email.js';
import Contact from '../models/Contact.js';

// @desc    Track conversion event
// @route   POST /api/revenue/track-conversion
// @access  Private
export const trackConversion = async (req, res) => {
  try {
    const {
      emailId,
      contactId,
      conversionType,
      revenue,
      value,
      externalId,
      metadata,
      source = 'manual'
    } = req.body;

    console.log('💰 Tracking conversion event:', {
      emailId,
      contactId,
      conversionType,
      revenue,
      externalId,
      source
    });

    // Get email and contact info
    const email = await Email.findOne({ _id: emailId, userId: req.user._id });
    if (!email) {
      console.error('❌ Email not found for conversion tracking:', emailId);
      return res.status(404).json({
        success: false,
        message: 'Email not found',
      });
    }

    let contact = null;
    if (contactId) {
      contact = await Contact.findOne({ _id: contactId, userId: req.user._id });
    }

    // Calculate attribution based on customer journey
    const attribution = await calculateAttribution(emailId, email.to.join(', '), req.user._id);

    console.log('🔍 Attribution calculated:', {
      touchpoints: attribution.touchpoints.length,
      model: attribution.model,
      confidence: attribution.confidence
    });

    // Create conversion event
    const conversionEvent = await ConversionEvent.create({
      emailId,
      userId: req.user._id,
      contactId: contact?._id,
      campaignId: email.campaignId,
      conversionType,
      revenue: revenue || { amount: 0, currency: 'USD' },
      value: value || 0,
      attribution,
      source,
      externalId,
      metadata: {
        ...metadata,
        customerEmail: email.to.join(', '),
        customerName: contact?.name?.full || 'Unknown',
      },
      occurredAt: new Date(),
    });

    console.log('✅ Conversion event tracked successfully:', conversionEvent._id);

    res.json({
      success: true,
      data: conversionEvent,
      message: 'Conversion event tracked successfully',
    });
  } catch (error) {
    console.error('❌ Track conversion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking conversion',
      error: error.message,
    });
  }
};

// @desc    Get revenue attribution for campaign
// @route   GET /api/revenue/attribution/:campaignId
// @access  Private
export const getRevenueAttribution = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { startDate, endDate } = req.query;

    console.log('📊 Calculating revenue attribution for campaign:', campaignId);

    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    if (Object.keys(dateFilter).length > 0) {
      dateFilter.occurredAt = dateFilter;
    }

    // Get all conversions for this campaign
    const conversions = await ConversionEvent.find({
      userId: req.user._id,
      campaignId,
      ...dateFilter,
    }).populate('emailId', 'subject sentAt').sort({ occurredAt: -1 });

    console.log(`📊 Found ${conversions.length} conversions for campaign`);

    // Calculate attribution metrics
    const attributionMetrics = {
      totalRevenue: 0,
      totalConversions: conversions.length,
      averageOrderValue: 0,
      attributionBreakdown: {
        firstTouch: 0,
        lastTouch: 0,
        multiTouch: 0,
      },
      topChannels: {},
      conversionFunnel: {
        emailsSent: 0,
        emailsOpened: 0,
        emailsClicked: 0,
        conversions: conversions.length,
      },
      roi: 0,
    };

    // Get campaign emails for funnel calculation
    const campaignEmails = await Email.find({
      userId: req.user._id,
      campaignId,
    });

    attributionMetrics.conversionFunnel.emailsSent = campaignEmails.length;

    // Calculate metrics
    conversions.forEach(conversion => {
      attributionMetrics.totalRevenue += conversion.revenue?.amount || 0;

      // Attribution breakdown
      if (conversion.attribution.touchpoints.length === 1) {
        if (conversion.attribution.model === 'first_touch') {
          attributionMetrics.attributionBreakdown.firstTouch += conversion.revenue?.amount || 0;
        } else {
          attributionMetrics.attributionBreakdown.lastTouch += conversion.revenue?.amount || 0;
        }
      } else {
        attributionMetrics.attributionBreakdown.multiTouch += conversion.revenue?.amount || 0;
      }
    });

    attributionMetrics.averageOrderValue = attributionMetrics.totalConversions > 0
      ? attributionMetrics.totalRevenue / attributionMetrics.totalConversions
      : 0;

    console.log('📊 Attribution metrics calculated:', {
      totalRevenue: attributionMetrics.totalRevenue,
      totalConversions: attributionMetrics.totalConversions,
      averageOrderValue: attributionMetrics.averageOrderValue
    });

    res.json({
      success: true,
      data: {
        conversions,
        metrics: attributionMetrics,
      },
    });
  } catch (error) {
    console.error('❌ Get revenue attribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating revenue attribution',
      error: error.message,
    });
  }
};

// @desc    Get ROI calculator
// @route   GET /api/revenue/roi
// @access  Private
export const getROI = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    console.log('💰 Calculating ROI metrics');

    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    if (Object.keys(dateFilter).length > 0) {
      dateFilter.occurredAt = dateFilter;
    }

    // Get all conversions
    const conversions = await ConversionEvent.find({
      userId: req.user._id,
      ...dateFilter,
    });

    // Get all emails sent (for cost calculation - simplified)
    const emailsSent = await Email.countDocuments({
      userId: req.user._id,
      ...dateFilter,
    });

    // Simplified cost calculation (in real implementation, integrate with actual costs)
    const costPerEmail = 0.10; // $0.10 per email sent
    const totalCost = emailsSent * costPerEmail;

    // Calculate revenue and ROI
    const totalRevenue = conversions.reduce((sum, conv) => sum + (conv.revenue?.amount || 0), 0);
    const totalConversions = conversions.length;

    const roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

    console.log('💰 ROI calculation completed:', {
      totalRevenue,
      totalCost,
      roi: `${roi.toFixed(2)}%`,
      totalConversions
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalCost,
        netProfit: totalRevenue - totalCost,
        roi: Math.round(roi * 100) / 100,
        profitMargin: Math.round(profitMargin * 100) / 100,
        totalConversions,
        emailsSent,
        averageRevenuePerEmail: emailsSent > 0 ? totalRevenue / emailsSent : 0,
        costPerAcquisition: totalConversions > 0 ? totalCost / totalConversions : 0,
      },
    });
  } catch (error) {
    console.error('❌ Get ROI error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating ROI',
      error: error.message,
    });
  }
};

// @desc    Get customer lifetime value
// @route   GET /api/revenue/ltv/:contactId
// @access  Private
export const getCustomerLTV = async (req, res) => {
  try {
    const { contactId } = req.params;

    console.log('💎 Calculating customer lifetime value for:', contactId);

    // Get all conversions for this contact
    const conversions = await ConversionEvent.find({
      userId: req.user._id,
      contactId,
    }).sort({ occurredAt: 1 });

    if (conversions.length === 0) {
      console.log('ℹ️ No conversions found for contact');
      return res.json({
        success: true,
        data: {
          lifetimeValue: 0,
          totalConversions: 0,
          averageOrderValue: 0,
          firstPurchaseDate: null,
          lastPurchaseDate: null,
          purchaseFrequency: 0,
          predictedLTV: 0,
        },
      });
    }

    // Calculate LTV metrics
    const totalRevenue = conversions.reduce((sum, conv) => sum + (conv.revenue?.amount || 0), 0);
    const totalConversions = conversions.length;
    const averageOrderValue = totalRevenue / totalConversions;

    const firstPurchaseDate = conversions[0].occurredAt;
    const lastPurchaseDate = conversions[conversions.length - 1].occurredAt;

    // Calculate purchase frequency (purchases per month)
    const monthsActive = Math.max(1,
      (lastPurchaseDate.getTime() - firstPurchaseDate.getTime()) /
      (1000 * 60 * 60 * 24 * 30)
    );
    const purchaseFrequency = totalConversions / monthsActive;

    // Simple LTV prediction (could be enhanced with ML)
    const predictedLTV = averageOrderValue * purchaseFrequency * 12; // Annual prediction

    console.log('💎 Customer LTV calculated:', {
      lifetimeValue: totalRevenue,
      totalConversions,
      averageOrderValue,
      predictedLTV
    });

    res.json({
      success: true,
      data: {
        lifetimeValue: totalRevenue,
        totalConversions,
        averageOrderValue,
        firstPurchaseDate,
        lastPurchaseDate,
        purchaseFrequency,
        predictedLTV,
        conversions: conversions.map(conv => ({
          date: conv.occurredAt,
          amount: conv.revenue?.amount || 0,
          type: conv.conversionType,
        })),
      },
    });
  } catch (error) {
    console.error('❌ Get customer LTV error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating customer lifetime value',
      error: error.message,
    });
  }
};

// @desc    Get revenue forecasting
// @route   GET /api/revenue/forecast
// @access  Private
export const getRevenueForecast = async (req, res) => {
  try {
    const { months = 6 } = req.query;

    console.log('🔮 Generating revenue forecast for', months, 'months');

    // Get historical data (last 12 months)
    const oneYearAgo = new Date();
    oneYearAgo.setMonth(oneYearAgo.getMonth() - 12);

    const historicalConversions = await ConversionEvent.find({
      userId: req.user._id,
      occurredAt: { $gte: oneYearAgo },
    }).sort({ occurredAt: 1 });

    // Group by month
    const monthlyRevenue = {};
    historicalConversions.forEach(conv => {
      const monthKey = `${conv.occurredAt.getFullYear()}-${String(conv.occurredAt.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (conv.revenue?.amount || 0);
    });

    // Simple forecasting (moving average)
    const monthlyValues = Object.values(monthlyRevenue);
    const averageMonthlyRevenue = monthlyValues.reduce((sum, val) => sum + val, 0) / monthlyValues.length;

    // Generate forecast
    const forecast = [];
    const currentDate = new Date();

    for (let i = 1; i <= parseInt(months); i++) {
      const forecastDate = new Date(currentDate);
      forecastDate.setMonth(currentDate.getMonth() + i);

      // Add some growth trend (could be enhanced with ML)
      const growthFactor = 1 + (i * 0.02); // 2% monthly growth
      const predictedRevenue = averageMonthlyRevenue * growthFactor;

      forecast.push({
        month: forecastDate.toISOString().slice(0, 7),
        predictedRevenue: Math.round(predictedRevenue * 100) / 100,
        confidence: Math.max(0.5, 1 - (i * 0.1)), // Confidence decreases over time
      });
    }

    console.log('🔮 Revenue forecast generated:', {
      months: forecast.length,
      averageHistorical: averageMonthlyRevenue,
      totalPredicted: forecast.reduce((sum, f) => sum + f.predictedRevenue, 0)
    });

    res.json({
      success: true,
      data: {
        forecast,
        historicalAverage: averageMonthlyRevenue,
        totalPredicted: forecast.reduce((sum, f) => sum + f.predictedRevenue, 0),
        confidence: 'medium', // Could be calculated based on data quality
      },
    });
  } catch (error) {
    console.error('❌ Get revenue forecast error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating revenue forecast',
      error: error.message,
    });
  }
};

// Helper function to calculate attribution
const calculateAttribution = async (emailId, recipientEmail, userId) => {
  try {
    console.log('🔍 Calculating attribution for email:', emailId);

    // Get customer journey (simplified - last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setMonth(thirtyDaysAgo.getMonth() - 1);

    // Find all emails sent to this recipient in the last 30 days
    const journeyEmails = await Email.find({
      userId,
      to: recipientEmail,
      createdAt: { $gte: thirtyDaysAgo },
    }).sort({ createdAt: 1 });

    const touchpoints = [];

    for (const email of journeyEmails) {
      // Check if email was opened or clicked (simplified)
      const hasActivity = Math.random() > 0.5; // In real implementation, check tracking data

      if (hasActivity) {
        touchpoints.push({
          emailId: email._id,
          timestamp: email.createdAt,
          interactionType: Math.random() > 0.5 ? 'open' : 'click',
          weight: 1 / journeyEmails.length, // Equal weight for simplicity
        });
      }
    }

    // Use last-touch attribution model
    const model = 'last_touch';
    const confidence = touchpoints.length > 0 ? 0.8 : 0.5;

    return {
      touchpoints,
      model,
      confidence,
    };
  } catch (error) {
    console.error('❌ Attribution calculation error:', error);
    return {
      touchpoints: [],
      model: 'last_touch',
      confidence: 0.5,
    };
  }
};
