import Email from '../models/Email.js';
import Prediction from '../models/Prediction.js';
import aiService from './aiService.js';

class PredictorService {
  // Main prediction method
  async predictPerformance(userId, emailData) {
    const { subject, recipientEmail, body, sendTime } = emailData;

    // Gather historical data
    const historicalData = await this.gatherHistoricalData(userId, recipientEmail);

    // Calculate base predictions
    const predictions = {
      openRate: await this.predictOpenRate(subject, recipientEmail, historicalData, userId),
      clickRate: await this.predictClickRate(subject, body, historicalData, userId),
      conversionRate: await this.predictConversionRate(historicalData, userId),
      bestSendTime: await this.predictBestSendTime(userId, recipientEmail),
    };

    // Save prediction
    const prediction = await Prediction.create({
      userId,
      subject,
      recipientEmail,
      predictions,
      historicalData,
    });

    return {
      predictionId: prediction._id,
      predictions,
      historicalData,
      confidence: this.calculateOverallConfidence(predictions),
    };
  }

  // Predict open rate (0-100%)
  async predictOpenRate(subject, recipientEmail, historicalData, userId) {
    let baseRate = 21.5; // Industry average
    let confidence = 50;
    const factors = [];

    // Subject analysis
    const subjectAnalysis = this.analyzeSubject(subject);
    if (subjectAnalysis.length <= 50) {
      baseRate += 5;
      factors.push('Optimal subject length');
      confidence += 10;
    } else if (subjectAnalysis.length > 78) {
      baseRate -= 8;
      factors.push('Subject too long');
      confidence += 5;
    }

    if (subjectAnalysis.hasPersonalization) {
      baseRate += 12;
      factors.push('Personalized subject');
      confidence += 15;
    }

    if (subjectAnalysis.hasEmoji) {
      baseRate += 8;
      factors.push('Contains emoji');
      confidence += 10;
    }

    if (subjectAnalysis.hasQuestion) {
      baseRate += 6;
      factors.push('Question in subject');
      confidence += 8;
    }

    // Historical recipient data
    if (historicalData.pastEmailsToRecipient > 0) {
      baseRate = (historicalData.recipientOpenRate * 0.7) + (baseRate * 0.3);
      factors.push(`Historical recipient open rate: ${historicalData.recipientOpenRate}%`);
      confidence += 25;
    }

    // Time-based factors
    const timeFactors = this.analyzeSendTime();
    baseRate *= timeFactors.multiplier;
    factors.push(...timeFactors.factors);
    confidence += timeFactors.confidence;

    // AI-enhanced prediction
    try {
      const aiPrediction = await aiService.callAI(
        [{
          role: 'user',
          content: `Analyze this email subject for open rate potential (0-100%): "${subject}". Current base prediction: ${baseRate.toFixed(1)}%. Provide a refined prediction with explanation.`
        }],
        userId,
        'performance_prediction'
      );

      // Extract number from AI response (simple parsing)
      const aiRateMatch = aiPrediction.match(/(\d+(?:\.\d+)?)%/);
      if (aiRateMatch) {
        const aiRate = parseFloat(aiRateMatch[1]);
        baseRate = (baseRate * 0.7) + (aiRate * 0.3); // Blend AI with statistical
        factors.push('AI-enhanced prediction');
        confidence += 10;
      }
    } catch (error) {
      console.error('AI prediction failed:', error.message);
      factors.push('Statistical prediction (AI unavailable)');
      // Continue with statistical prediction only
    }

    return {
      value: Math.max(0, Math.min(100, Math.round(baseRate))),
      confidence: Math.min(100, confidence),
      factors,
    };
  }

  // Predict click rate
  async predictClickRate(subject, body, historicalData, userId) {
    let baseRate = 2.6; // Industry average
    let confidence = 40;
    const factors = [];

    // Content analysis
    const contentAnalysis = this.analyzeContent(body);
    if (contentAnalysis.hasCallToAction) {
      baseRate += 1.5;
      factors.push('Clear call-to-action');
      confidence += 15;
    }

    if (contentAnalysis.linkCount > 0) {
      baseRate += contentAnalysis.linkCount * 0.8;
      factors.push(`${contentAnalysis.linkCount} links in content`);
      confidence += 10;
    }

    if (contentAnalysis.isPersonalized) {
      baseRate += 1.2;
      factors.push('Personalized content');
      confidence += 12;
    }

    // Historical data
    if (historicalData.pastEmailsToRecipient > 0) {
      baseRate = (historicalData.recipientClickRate * 0.6) + (baseRate * 0.4);
      factors.push(`Historical recipient click rate: ${historicalData.recipientClickRate}%`);
      confidence += 20;
    }

    // Subject alignment
    if (subject.toLowerCase().includes('free') || subject.toLowerCase().includes('offer')) {
      baseRate += 0.8;
      factors.push('Value proposition in subject');
      confidence += 8;
    }

    return {
      value: Math.max(0, Math.min(100, Math.round(baseRate * 10) / 10)),
      confidence: Math.min(100, confidence),
      factors,
    };
  }

  // Predict conversion rate
  async predictConversionRate(historicalData, userId) {
    let baseRate = 1.2; // Industry average
    let confidence = 35;
    const factors = [];

    if (historicalData.pastEmailsToRecipient >= 5) {
      // High engagement history
      const engagementScore = (historicalData.recipientOpenRate + historicalData.recipientClickRate) / 2;
      if (engagementScore > 25) {
        baseRate += 0.8;
        factors.push('High historical engagement');
        confidence += 20;
      } else if (engagementScore < 10) {
        baseRate -= 0.4;
        factors.push('Low historical engagement');
        confidence += 15;
      }
    } else {
      factors.push('Limited historical data');
      confidence -= 10;
    }

    return {
      value: Math.max(0, Math.min(100, Math.round(baseRate * 10) / 10)),
      confidence: Math.min(100, confidence),
      factors,
    };
  }

  // Predict best send time
  async predictBestSendTime(userId, recipientEmail) {
    // Get historical open data for this recipient
    const pastEmails = await Email.find({
      userId,
      'recipients.to': recipientEmail,
      'tracking.firstOpenedAt': { $exists: true },
    }).limit(20);

    if (pastEmails.length === 0) {
      return {
        hour: 10, // Default to 10 AM
        dayOfWeek: 2, // Tuesday
        confidence: 30,
      };
    }

    // Analyze open times
    const openHours = pastEmails.map(e => new Date(e.tracking.firstOpenedAt).getHours());
    const openDays = pastEmails.map(e => new Date(e.tracking.firstOpenedAt).getDay());

    // Find most common hour
    const hourCounts = {};
    openHours.forEach(hour => hourCounts[hour] = (hourCounts[hour] || 0) + 1);
    const bestHour = Object.keys(hourCounts).reduce((a, b) =>
      hourCounts[a] > hourCounts[b] ? a : b, 10
    );

    // Find most common day
    const dayCounts = {};
    openDays.forEach(day => dayCounts[day] = (dayCounts[day] || 0) + 1);
    const bestDay = Object.keys(dayCounts).reduce((a, b) =>
      dayCounts[a] > dayCounts[b] ? a : b, 2
    );

    return {
      hour: parseInt(bestHour),
      dayOfWeek: parseInt(bestDay),
      confidence: Math.min(100, pastEmails.length * 5), // 5% confidence per email
    };
  }

  // Helper methods
  analyzeSubject(subject) {
    return {
      length: subject.length,
      hasEmoji: /[\u{1F300}-\u{1F9FF}]/u.test(subject),
      hasNumbers: /\d/.test(subject),
      hasQuestion: subject.includes('?'),
      hasPersonalization: /\{\{|\[\[|\{\w+\}\}|\w+@\w+/.test(subject),
      wordCount: subject.split(' ').length,
    };
  }

  analyzeContent(body) {
    const text = body.toLowerCase();
    return {
      hasCallToAction: /(click here|learn more|sign up|get started|download|register)/.test(text),
      linkCount: (body.match(/https?:\/\//g) || []).length,
      isPersonalized: /\{\{|\[\[|\{\w+\}\}/.test(body),
      length: body.length,
      hasImages: body.includes('<img'),
      hasButtons: body.includes('button') || body.includes('btn'),
    };
  }

  analyzeSendTime() {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    let multiplier = 1;
    const factors = [];
    let confidence = 0;

    // Best hours: 8-11 AM, 1-3 PM
    if ((hour >= 8 && hour <= 11) || (hour >= 13 && hour <= 15)) {
      multiplier = 1.1;
      factors.push('Optimal send hour');
      confidence += 10;
    } else if (hour >= 18 && hour <= 23) {
      multiplier = 0.9;
      factors.push('Late evening send');
      confidence += 5;
    }

    // Best days: Tuesday-Thursday
    if (dayOfWeek >= 2 && dayOfWeek <= 4) {
      multiplier *= 1.05;
      factors.push('Optimal day of week');
      confidence += 8;
    } else if (dayOfWeek === 0 || dayOfWeek === 6) {
      multiplier *= 0.95;
      factors.push('Weekend send');
      confidence += 3;
    }

    return { multiplier, factors, confidence };
  }

  async gatherHistoricalData(userId, recipientEmail) {
    const pastEmails = await Email.find({
      userId,
      'recipients.to': recipientEmail,
    }).limit(50);

    if (pastEmails.length === 0) {
      return {
        pastEmailsToRecipient: 0,
        recipientOpenRate: 21.5, // Industry average
        recipientClickRate: 2.6,  // Industry average
      };
    }

    const openedEmails = pastEmails.filter(e => e.tracking.totalOpens > 0);
    const clickedEmails = pastEmails.filter(e => e.tracking.totalClicks > 0);

    return {
      pastEmailsToRecipient: pastEmails.length,
      recipientOpenRate: pastEmails.length > 0 ? ((openedEmails.length / pastEmails.length) * 100).toFixed(1) : 0,
      recipientClickRate: openedEmails.length > 0 ? ((clickedEmails.length / openedEmails.length) * 100).toFixed(1) : 0,
    };
  }

  calculateOverallConfidence(predictions) {
    const weights = {
      openRate: 0.4,
      clickRate: 0.3,
      conversionRate: 0.2,
      bestSendTime: 0.1,
    };

    const weightedConfidence =
      (predictions.openRate.confidence * weights.openRate) +
      (predictions.clickRate.confidence * weights.clickRate) +
      (predictions.conversionRate.confidence * weights.conversionRate) +
      (predictions.bestSendTime.confidence * weights.bestSendTime);

    return Math.round(weightedConfidence);
  }

  // Update prediction with actual results
  async updatePrediction(predictionId, actualResults) {
    const prediction = await Prediction.findById(predictionId);
    if (!prediction) return;

    prediction.actualResults = {
      ...prediction.actualResults,
      ...actualResults,
    };

    // Calculate accuracy
    prediction.accuracy = {
      openRateDiff: prediction.actualResults.opened
        ? Math.abs(prediction.predictions.openRate.value - 100)
        : Math.abs(prediction.predictions.openRate.value - 0),
      clickRateDiff: prediction.actualResults.clicked
        ? Math.abs(prediction.predictions.clickRate.value - 100)
        : Math.abs(prediction.predictions.clickRate.value - 0),
      conversionRateDiff: prediction.actualResults.converted
        ? Math.abs(prediction.predictions.conversionRate.value - 100)
        : Math.abs(prediction.predictions.conversionRate.value - 0),
      sendTimeAccuracy: this.checkSendTimeAccuracy(prediction),
    };

    await prediction.save();
    return prediction;
  }

  checkSendTimeAccuracy(prediction) {
    if (!prediction.actualResults.opened || !prediction.actualResults.openTime) {
      return false;
    }

    const actualHour = new Date(prediction.actualResults.openTime).getHours();
    const actualDay = new Date(prediction.actualResults.openTime).getDay();

    const predictedHour = prediction.predictions.bestSendTime.hour;
    const predictedDay = prediction.predictions.bestSendTime.dayOfWeek;

    // Consider accurate if within 2 hours and same day
    return Math.abs(actualHour - predictedHour) <= 2 && actualDay === predictedDay;
  }

  // Get prediction history
  async getPredictionHistory(userId, emailId = null) {
    const query = { userId };
    if (emailId) query.emailId = emailId;

    return await Prediction.find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('emailId', 'subject sentAt');
  }
}

export default new PredictorService();
