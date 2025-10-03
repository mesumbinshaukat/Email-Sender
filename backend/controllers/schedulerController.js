import { DateTime } from 'luxon';
import Email from '../models/Email.js';
import aiService from '../services/aiService.js';
import emailQueue from '../config/queue.js';

// Schedule email with AI-determined optimal time
export const scheduleEmail = async (req, res) => {
  try {
    const { subject, recipients, body, campaignId, timezone } = req.body;
    const userId = req.user._id;

    // Validate recipients
    if (!recipients?.to || recipients.to.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one recipient is required',
      });
    }

    const recipientEmail = recipients.to[0]; // Use first recipient for optimal time analysis

    // Get optimal send time
    const optimalTimeData = await determineOptimalTime(userId, recipientEmail, timezone);

    // Create email document
    const email = await Email.create({
      userId,
      campaignId: campaignId || null,
      trackingId: generateTrackingId(),
      subject,
      recipients,
      body,
      status: 'queued',
      scheduledAt: optimalTimeData.optimalTime,
      schedulingMetadata: {
        optimalTime: optimalTimeData.optimalTime,
        timezone: optimalTimeData.timezone,
        aiConfidence: optimalTimeData.confidence,
        engagementScore: optimalTimeData.engagementScore,
        fallbackReason: optimalTimeData.fallbackReason,
      },
    });

    // Calculate delay in milliseconds
    const delay = optimalTimeData.optimalTime.getTime() - Date.now();

    // Add to queue
    const job = await emailQueue.add(
      {
        emailId: email._id.toString(),
        userId: userId.toString(),
      },
      {
        delay: Math.max(0, delay), // Ensure non-negative delay
        jobId: `email-${email._id}`,
      }
    );

    // Update email with job ID
    email.queueJobId = job.id.toString();
    await email.save();

    res.json({
      success: true,
      email: {
        id: email._id,
        subject: email.subject,
        scheduledAt: email.scheduledAt,
        status: email.status,
        queueJobId: email.queueJobId,
        optimalTimeData,
      },
    });
  } catch (error) {
    console.error('Schedule email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule email',
      error: error.message,
    });
  }
};

// Get optimal send times for a recipient
export const getOptimalTimes = async (req, res) => {
  try {
    const { recipientEmail } = req.params;
    const userId = req.user._id;
    const { timezone } = req.query;

    // Get engagement history
    const engagementData = await analyzeRecipientEngagement(userId, recipientEmail);

    // Generate multiple optimal time suggestions
    const suggestions = await generateTimeSuggestions(
      userId,
      recipientEmail,
      engagementData,
      timezone
    );

    res.json({
      success: true,
      recipientEmail,
      suggestions,
      engagementData: {
        totalEmails: engagementData.totalEmails,
        openRate: engagementData.openRate,
        avgResponseTime: engagementData.avgResponseTime,
      },
    });
  } catch (error) {
    console.error('Get optimal times error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get optimal times',
      error: error.message,
    });
  }
};

// Reschedule an email
export const rescheduleEmail = async (req, res) => {
  try {
    const { emailId } = req.params;
    const { newTime, timezone } = req.body;
    const userId = req.user._id;

    // Find email
    const email = await Email.findOne({ _id: emailId, userId });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found',
      });
    }

    if (email.status !== 'queued') {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule email with status: ${email.status}`,
      });
    }

    // Parse new time
    const newScheduledTime = newTime ? new Date(newTime) : null;

    if (!newScheduledTime || newScheduledTime < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or past scheduled time',
      });
    }

    // Remove old job from queue
    if (email.queueJobId) {
      const oldJob = await emailQueue.getJob(email.queueJobId);
      if (oldJob) {
        await oldJob.remove();
      }
    }

    // Calculate new delay
    const delay = newScheduledTime.getTime() - Date.now();

    // Add new job to queue
    const job = await emailQueue.add(
      {
        emailId: email._id.toString(),
        userId: userId.toString(),
      },
      {
        delay: Math.max(0, delay),
        jobId: `email-${email._id}-rescheduled`,
      }
    );

    // Update email
    email.scheduledAt = newScheduledTime;
    email.queueJobId = job.id.toString();
    email.schedulingMetadata.timezone = timezone || email.schedulingMetadata.timezone;
    await email.save();

    res.json({
      success: true,
      email: {
        id: email._id,
        scheduledAt: email.scheduledAt,
        queueJobId: email.queueJobId,
      },
    });
  } catch (error) {
    console.error('Reschedule email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule email',
      error: error.message,
    });
  }
};

// Get user's email queue
export const getQueue = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get queued emails
    const queuedEmails = await Email.find({
      userId,
      status: 'queued',
    })
      .sort({ scheduledAt: 1 })
      .select('subject recipients scheduledAt queueJobId schedulingMetadata createdAt');

    // Get job statuses from queue
    const emailsWithStatus = await Promise.all(
      queuedEmails.map(async (email) => {
        let jobStatus = 'unknown';
        if (email.queueJobId) {
          const job = await emailQueue.getJob(email.queueJobId);
          if (job) {
            const state = await job.getState();
            jobStatus = state;
          }
        }

        return {
          id: email._id,
          subject: email.subject,
          recipients: email.recipients,
          scheduledAt: email.scheduledAt,
          queueJobId: email.queueJobId,
          jobStatus,
          schedulingMetadata: email.schedulingMetadata,
          createdAt: email.createdAt,
        };
      })
    );

    res.json({
      success: true,
      queue: emailsWithStatus,
      total: emailsWithStatus.length,
    });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get queue',
      error: error.message,
    });
  }
};

// Helper: Determine optimal send time using AI
async function determineOptimalTime(userId, recipientEmail, userTimezone) {
  // Get engagement history first (needed for both AI and fallback)
  const engagement = await analyzeRecipientEngagement(userId, recipientEmail);

  try {
    // Use AI to analyze and determine optimal time
    if (engagement.totalEmails >= 3 && aiService.isAvailable()) {
      const prompt = `Analyze this email engagement data and determine the optimal send time:

Recipient: ${recipientEmail}
Total emails sent: ${engagement.totalEmails}
Open rate: ${(engagement.openRate * 100).toFixed(1)}%
Average time to open: ${engagement.avgResponseTime} hours
Most active hours: ${engagement.mostActiveHours.join(', ')}
Timezone: ${userTimezone || 'UTC'}

Based on this data, recommend the best time to send an email to maximize engagement.
Consider:
1. Recipient's past engagement patterns
2. Avoiding busy work hours (9am-5pm local time)
3. Timezone differences
4. Day of week patterns

Return JSON only:
{
  "recommendedHour": 10,
  "recommendedDay": "Tuesday",
  "confidence": 0.85,
  "reasoning": "Brief explanation"
}`;

      const aiResponse = await aiService.callAI(
        [{ role: 'user', content: prompt }],
        userId,
        'email_scheduling'
      );

      const aiData = JSON.parse(aiResponse);
      
      // Calculate optimal time based on AI recommendation
      const tz = userTimezone || 'UTC';
      let optimalTime = DateTime.now().setZone(tz);
      
      // Find next occurrence of recommended day
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const targetDay = daysOfWeek.indexOf(aiData.recommendedDay);
      
      while (optimalTime.weekday !== targetDay) {
        optimalTime = optimalTime.plus({ days: 1 });
      }
      
      // Set recommended hour
      optimalTime = optimalTime.set({ hour: aiData.recommendedHour, minute: 0, second: 0 });
      
      // Ensure it's in the future
      if (optimalTime < DateTime.now()) {
        optimalTime = optimalTime.plus({ weeks: 1 });
      }

      return {
        optimalTime: optimalTime.toJSDate(),
        timezone: tz,
        confidence: aiData.confidence,
        engagementScore: engagement.openRate,
        fallbackReason: null,
      };
    }
  } catch (error) {
    console.error('AI optimal time determination failed:', error);
  }

  // Fallback: Default to 10am tomorrow in user's timezone
  const tz = userTimezone || 'UTC';
  const fallbackTime = DateTime.now()
    .setZone(tz)
    .plus({ days: 1 })
    .set({ hour: 10, minute: 0, second: 0 });

  return {
    optimalTime: fallbackTime.toJSDate(),
    timezone: tz,
    confidence: 0.5,
    engagementScore: engagement.openRate || 0,
    fallbackReason: engagement.totalEmails < 3 
      ? 'Insufficient engagement data' 
      : 'AI analysis unavailable',
  };
}

// Helper: Analyze recipient engagement
async function analyzeRecipientEngagement(userId, recipientEmail) {
  const emails = await Email.find({
    userId,
    'recipients.to': recipientEmail,
    status: 'sent',
  }).sort({ sentAt: -1 }).limit(50);

  if (emails.length === 0) {
    return {
      totalEmails: 0,
      openRate: 0,
      avgResponseTime: 0,
      mostActiveHours: [],
    };
  }

  const openedEmails = emails.filter(e => e.tracking.totalOpens > 0);
  const openRate = openedEmails.length / emails.length;

  // Calculate average time to first open
  const responseTimes = openedEmails
    .filter(e => e.tracking.firstOpenedAt && e.sentAt)
    .map(e => (e.tracking.firstOpenedAt - e.sentAt) / (1000 * 60 * 60)); // hours

  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;

  // Find most active hours
  const openHours = openedEmails
    .filter(e => e.tracking.firstOpenedAt)
    .map(e => new Date(e.tracking.firstOpenedAt).getHours());

  const hourCounts = {};
  openHours.forEach(h => hourCounts[h] = (hourCounts[h] || 0) + 1);
  
  const mostActiveHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  return {
    totalEmails: emails.length,
    openRate,
    avgResponseTime: Math.round(avgResponseTime * 10) / 10,
    mostActiveHours,
  };
}

// Helper: Generate multiple time suggestions
async function generateTimeSuggestions(userId, recipientEmail, engagementData, timezone) {
  const tz = timezone || 'UTC';
  const suggestions = [];

  // Suggestion 1: AI-determined optimal time
  const optimal = await determineOptimalTime(userId, recipientEmail, tz);
  suggestions.push({
    time: optimal.optimalTime,
    label: 'AI Recommended',
    confidence: optimal.confidence,
    reasoning: optimal.fallbackReason || 'Based on engagement patterns',
  });

  // Suggestion 2: Tomorrow 10am
  const tomorrow10am = DateTime.now().setZone(tz).plus({ days: 1 }).set({ hour: 10, minute: 0, second: 0 });
  suggestions.push({
    time: tomorrow10am.toJSDate(),
    label: 'Tomorrow Morning',
    confidence: 0.7,
    reasoning: 'Safe default time',
  });

  // Suggestion 3: Next Monday 9am
  let nextMonday = DateTime.now().setZone(tz);
  while (nextMonday.weekday !== 1) {
    nextMonday = nextMonday.plus({ days: 1 });
  }
  nextMonday = nextMonday.set({ hour: 9, minute: 0, second: 0 });
  
  suggestions.push({
    time: nextMonday.toJSDate(),
    label: 'Next Monday',
    confidence: 0.65,
    reasoning: 'Start of work week',
  });

  return suggestions;
}

// Helper: Generate tracking ID
function generateTrackingId() {
  return `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
