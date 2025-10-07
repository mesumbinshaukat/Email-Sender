import Meeting from '../models/Meeting.js';
import Email from '../models/Email.js';
import { sendTrackedEmail } from '../utils/emailService.js';

// @desc    Detect meeting intent in email content
// @route   POST /api/meetings/detect-intent
// @access  Private
export const detectMeetingIntent = async (req, res) => {
  try {
    const { emailId, content } = req.body;

    // Get the original email
    const email = await Email.findOne({
      _id: emailId,
      userId: req.user._id,
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found',
      });
    }

    // Analyze content for meeting intent
    const analysis = await analyzeMeetingIntent(content);

    if (analysis.intent !== 'no_intent') {
      // Create meeting record
      const meeting = await Meeting.create({
        emailId,
        userId: req.user._id,
        contactEmail: email.to.join(', '),
        contactName: email.to.join(', '), // Could be enhanced with contact lookup
        intent: analysis.intent,
        confidence: analysis.confidence,
        aiAnalysis: {
          detectedAt: new Date(),
          analysis: analysis.explanation,
          keyPhrases: analysis.keyPhrases,
          urgency: analysis.urgency,
        },
        status: 'detected',
      });

      // Generate time suggestions
      const timeSuggestions = await generateTimeSuggestions(req.user._id, analysis.urgency);
      meeting.suggestedTimes = timeSuggestions;
      await meeting.save();

      res.json({
        success: true,
        data: meeting,
        message: 'Meeting intent detected and suggestions generated',
      });
    } else {
      res.json({
        success: true,
        data: null,
        message: 'No meeting intent detected',
      });
    }
  } catch (error) {
    console.error('Detect meeting intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Error detecting meeting intent',
      error: error.message,
    });
  }
};

// @desc    Get available time slots
// @route   GET /api/meetings/available-slots
// @access  Private
export const getAvailableSlots = async (req, res) => {
  try {
    const { date, duration = 30 } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    // Generate available time slots for the day
    const slots = generateTimeSlots(targetDate, parseInt(duration));

    // Check which slots are already booked (simplified - would integrate with calendar APIs)
    const bookedMeetings = await Meeting.find({
      userId: req.user._id,
      'selectedTime.date': {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lt: new Date(targetDate.setHours(23, 59, 59, 999)),
      },
      status: { $in: ['scheduled', 'confirmed'] },
    });

    // Mark booked slots
    const bookedTimes = bookedMeetings.map(m => m.selectedTime.time);
    const availableSlots = slots.map(slot => ({
      ...slot,
      available: !bookedTimes.includes(slot.time),
    }));

    res.json({
      success: true,
      data: availableSlots,
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available slots',
      error: error.message,
    });
  }
};

// @desc    Schedule a meeting
// @route   POST /api/meetings/schedule
// @access  Private
export const scheduleMeeting = async (req, res) => {
  try {
    const { meetingId, selectedTime, meetingDetails } = req.body;

    const meeting = await Meeting.findOne({
      _id: meetingId,
      userId: req.user._id,
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    // Update meeting with selected time and details
    meeting.selectedTime = selectedTime;
    meeting.meetingDetails = meetingDetails;
    meeting.status = 'scheduled';

    // Generate meeting URL if needed
    if (!meetingDetails.meetingLink && meetingDetails.location !== 'phone' && meetingDetails.location !== 'in_person') {
      meeting.meetingDetails.meetingLink = meeting.meetingUrl;
    }

    await meeting.save();

    res.json({
      success: true,
      data: meeting,
      message: 'Meeting scheduled successfully',
    });
  } catch (error) {
    console.error('Schedule meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Error scheduling meeting',
      error: error.message,
    });
  }
};

// @desc    Send calendar invite
// @route   POST /api/meetings/send-invite
// @access  Private
export const sendCalendarInvite = async (req, res) => {
  try {
    const { meetingId } = req.body;

    const meeting = await Meeting.findOne({
      _id: meetingId,
      userId: req.user._id,
    }).populate('emailId');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    // Generate calendar invite
    const calendarInvite = meeting.generateCalendarInvite();

    // Create calendar invite email
    const inviteEmail = await Email.create({
      userId: req.user._id,
      to: [meeting.contactEmail],
      subject: `Meeting Invitation: ${calendarInvite.title}`,
      htmlBody: generateCalendarInviteHTML(calendarInvite, meeting),
      status: 'pending',
    });

    // Send the invite
    const result = await sendTrackedEmail(inviteEmail);

    // Update meeting status
    meeting.calendarIntegration.inviteSent = true;
    await meeting.save();

    // Update email status
    inviteEmail.status = 'sent';
    inviteEmail.sentAt = new Date();
    await inviteEmail.save();

    res.json({
      success: true,
      data: meeting,
      message: 'Calendar invite sent successfully',
    });
  } catch (error) {
    console.error('Send calendar invite error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending calendar invite',
      error: error.message,
    });
  }
};

// @desc    Get calendar sync status
// @route   GET /api/meetings/calendar-sync
// @access  Private
export const getCalendarSync = async (req, res) => {
  try {
    // This would integrate with actual calendar APIs
    // For now, return mock data
    const syncStatus = {
      googleCalendar: {
        connected: false,
        lastSync: null,
        status: 'not_connected',
      },
      outlookCalendar: {
        connected: false,
        lastSync: null,
        status: 'not_connected',
      },
      upcomingMeetings: await Meeting.find({
        userId: req.user._id,
        status: { $in: ['scheduled', 'confirmed'] },
        'selectedTime.date': { $gte: new Date() },
      }).sort({ 'selectedTime.date': 1 }).limit(10),
    };

    res.json({
      success: true,
      data: syncStatus,
    });
  } catch (error) {
    console.error('Get calendar sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching calendar sync status',
      error: error.message,
    });
  }
};

// @desc    Get all meetings for user
// @route   GET /api/meetings
// @access  Private
export const getMeetings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;

    const query = { userId: req.user._id };
    if (status) {
      query.status = status;
    }

    const meetings = await Meeting.find(query)
      .populate('emailId', 'subject sentAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Meeting.countDocuments(query);

    res.json({
      success: true,
      data: meetings,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: meetings.length,
      },
    });
  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching meetings',
      error: error.message,
    });
  }
};

// Helper function to analyze meeting intent
const analyzeMeetingIntent = async (content) => {
  try {
    const aiService = (await import('../services/aiService.js')).default;

    const messages = [
      {
        role: 'system',
        content: `You are an expert at detecting meeting requests in emails. Analyze the content and determine if there's an intent to schedule a meeting, call, or demo. Return analysis in JSON format.`
      },
      {
        role: 'user',
        content: `Analyze this email content for meeting intent: "${content}"

Return analysis as JSON with this structure:
{
  "intent": "meeting_request|call_request|demo_request|consultation|follow_up|no_intent",
  "confidence": 0-1,
  "urgency": "low|medium|high",
  "keyPhrases": ["array of key phrases"],
  "explanation": "brief explanation of the analysis"
}`
      }
    ];

    const response = await aiService.callAI(messages, null, 'meeting_intent_analysis', {
      temperature: 0.3,
      maxTokens: 300,
    });

    return JSON.parse(response);
  } catch (error) {
    console.error('Meeting intent analysis error:', error);
    return {
      intent: 'no_intent',
      confidence: 0,
      urgency: 'low',
      keyPhrases: [],
      explanation: 'Analysis failed',
    };
  }
};

// Helper function to generate time suggestions
const generateTimeSuggestions = async (userId, urgency) => {
  const suggestions = [];
  const now = new Date();

  // Generate suggestions based on urgency
  let daysAhead = urgency === 'high' ? 1 : urgency === 'medium' ? 3 : 7;

  for (let day = 1; day <= daysAhead; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() + day);

    // Skip weekends if not urgent
    if (urgency !== 'high' && (date.getDay() === 0 || date.getDay() === 6)) {
      continue;
    }

    // Generate 3 time slots per day
    const timeSlots = ['09:00', '14:00', '16:00'];

    timeSlots.forEach(time => {
      suggestions.push({
        date,
        time,
        duration: 30,
        timezone: 'UTC', // Would be user's timezone
        available: true,
        booked: false,
      });
    });
  }

  return suggestions.slice(0, 9); // Return top 9 suggestions
};

// Helper function to generate time slots
const generateTimeSlots = (date, duration) => {
  const slots = [];
  const startHour = 9; // 9 AM
  const endHour = 17; // 5 PM

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += duration) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push({
        date,
        time: timeString,
        duration,
        timezone: 'UTC',
      });
    }
  }

  return slots;
};

// Helper function to generate calendar invite HTML
const generateCalendarInviteHTML = (invite, meeting) => {
  const startTime = invite.startTime.toLocaleString();
  const endTime = invite.endTime.toLocaleString();

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Meeting Invitation</h2>

      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${invite.title}</h3>
        <p><strong>When:</strong> ${startTime} - ${endTime}</p>
        <p><strong>Where:</strong> ${invite.location || 'To be determined'}</p>

        ${meeting.meetingDetails?.meetingLink ? `
          <p><strong>Meeting Link:</strong> <a href="${meeting.meetingDetails.meetingLink}" style="color: #007bff;">${meeting.meetingDetails.meetingLink}</a></p>
        ` : ''}

        <p><strong>Description:</strong></p>
        <p>${invite.description}</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="#" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Add to Calendar
        </a>
      </div>

      <p style="color: #666; font-size: 14px;">
        This meeting was scheduled automatically by AI Meeting Scheduler.
      </p>
    </div>
  `;
};
