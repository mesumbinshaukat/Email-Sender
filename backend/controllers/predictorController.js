import predictorService from '../services/predictorService.js';
import Prediction from '../models/Prediction.js';

/**
 * @desc    Predict email performance before sending
 * @route   POST /api/predictor/performance
 * @access  Private
 */
export const predictPerformance = async (req, res) => {
  try {
    const userId = req.user._id;
    const { subject, recipientEmail, body, sendTime } = req.body;

    if (!subject || !recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'Subject and recipient email are required',
      });
    }

    const result = await predictorService.predictPerformance(userId, {
      subject,
      recipientEmail,
      body,
      sendTime,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Predict performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate performance prediction',
    });
  }
};

/**
 * @desc    Get prediction history for an email
 * @route   GET /api/predictor/history/:emailId
 * @access  Private
 */
export const getPredictionHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { emailId } = req.params;

    const predictions = await predictorService.getPredictionHistory(userId, emailId);

    res.json({
      success: true,
      data: predictions,
    });
  } catch (error) {
    console.error('Get prediction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prediction history',
    });
  }
};

/**
 * @desc    Get user's prediction accuracy stats
 * @route   GET /api/predictor/accuracy
 * @access  Private
 */
export const getPredictionAccuracy = async (req, res) => {
  try {
    const userId = req.user._id;

    const predictions = await Prediction.find({
      userId,
      'actualResults.opened': { $exists: true },
    }).limit(100);

    if (predictions.length === 0) {
      return res.json({
        success: true,
        data: {
          totalPredictions: 0,
          accuracy: {
            openRate: 0,
            clickRate: 0,
            conversionRate: 0,
            sendTime: 0,
          },
          message: 'No prediction data available yet',
        },
      });
    }

    const accuracy = {
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      sendTime: 0,
    };

    predictions.forEach(pred => {
      if (pred.accuracy) {
        accuracy.openRate += pred.accuracy.openRateDiff <= 20 ? 1 : 0;
        accuracy.clickRate += pred.accuracy.clickRateDiff <= 20 ? 1 : 0;
        accuracy.conversionRate += pred.accuracy.conversionRateDiff <= 20 ? 1 : 0;
        accuracy.sendTime += pred.accuracy.sendTimeAccuracy ? 1 : 0;
      }
    });

    // Calculate percentages
    Object.keys(accuracy).forEach(key => {
      accuracy[key] = Math.round((accuracy[key] / predictions.length) * 100);
    });

    res.json({
      success: true,
      data: {
        totalPredictions: predictions.length,
        accuracy,
        lastUpdated: predictions[0]?.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get prediction accuracy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prediction accuracy',
    });
  }
};

/**
 * @desc    Update prediction with actual results
 * @route   POST /api/predictor/update/:predictionId
 * @access  Private
 */
export const updatePrediction = async (req, res) => {
  try {
    const { predictionId } = req.params;
    const { opened, clicked, converted, openTime, clickTime } = req.body;

    const updatedPrediction = await predictorService.updatePrediction(predictionId, {
      opened,
      clicked,
      converted,
      openTime,
      clickTime,
    });

    if (!updatedPrediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found',
      });
    }

    res.json({
      success: true,
      data: updatedPrediction,
      message: 'Prediction updated with actual results',
    });
  } catch (error) {
    console.error('Update prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update prediction',
    });
  }
};

/**
 * @desc    Save a prediction for future reference
 * @route   POST /api/predictor/save
 * @access  Private
 */
export const savePrediction = async (req, res) => {
  try {
    const userId = req.user._id;
    const { subject, recipientEmail, body, prediction } = req.body;

    if (!prediction || !subject || !recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'Prediction data, subject, and recipient email are required',
      });
    }

    // Create saved prediction record
    const savedPrediction = await Prediction.create({
      userId,
      emailData: {
        subject,
        recipientEmail,
        body,
      },
      predictions: prediction.predictions,
      historicalData: prediction.historicalData,
      confidence: prediction.confidence,
      status: 'saved', // Mark as saved for future reference
    });

    res.status(201).json({
      success: true,
      data: {
        predictionId: savedPrediction._id,
        savedAt: savedPrediction.createdAt,
      },
      message: 'Prediction saved successfully',
    });
  } catch (error) {
    console.error('Save prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save prediction',
    });
  }
};

/**
 * @desc    Get prediction insights
 * @route   GET /api/predictor/insights
 * @access  Private
 */
export const getPredictionInsights = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get recent predictions
    const recentPredictions = await Prediction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('predictions historicalData createdAt');

    // Calculate trends
    const insights = {
      averageConfidence: 0,
      topFactors: {},
      bestPerformingTimes: {},
      improvementAreas: [],
    };

    if (recentPredictions.length > 0) {
      // Average confidence
      const totalConfidence = recentPredictions.reduce((sum, pred) => {
        return sum + (
          pred.predictions.openRate.confidence +
          pred.predictions.clickRate.confidence +
          pred.predictions.conversionRate.confidence
        ) / 3;
      }, 0);
      insights.averageConfidence = Math.round(totalConfidence / recentPredictions.length);

      // Top factors
      recentPredictions.forEach(pred => {
        [...pred.predictions.openRate.factors, ...pred.predictions.clickRate.factors].forEach(factor => {
          insights.topFactors[factor] = (insights.topFactors[factor] || 0) + 1;
        });
      });

      // Best performing times
      recentPredictions.forEach(pred => {
        const hour = pred.predictions.bestSendTime.hour;
        insights.bestPerformingTimes[hour] = (insights.bestPerformingTimes[hour] || 0) + 1;
      });

      // Improvement areas (low confidence predictions)
      const lowConfidence = recentPredictions.filter(pred =>
        pred.predictions.openRate.confidence < 50 ||
        pred.predictions.clickRate.confidence < 50
      );

      if (lowConfidence.length > recentPredictions.length * 0.5) {
        insights.improvementAreas.push('Send more emails to build better prediction models');
      }
    }

    res.json({
      success: true,
      data: {
        insights,
        recentPredictionsCount: recentPredictions.length,
        lastUpdated: recentPredictions[0]?.createdAt,
      },
    });
  } catch (error) {
    console.error('Get prediction insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prediction insights',
    });
  }
};
