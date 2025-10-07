import asyncHandler from 'express-async-handler';
import CalendarIntegration from '../models/CalendarIntegration.js';
import { google } from 'googleapis';

// @desc    Connect calendar
// @route   POST /api/calendar/connect
// @access  Private
const connectCalendar = asyncHandler(async (req, res) => {
  const { provider, credentials, settings } = req.body;
  const userId = req.user._id;

  const integration = await CalendarIntegration.create({
    user: userId,
    provider,
    credentials,
    settings,
    status: 'connected'
  });

  res.status(201).json(integration);
});

// @desc    Get calendar integrations
// @route   GET /api/calendar/integrations
// @access  Private
const getCalendarIntegrations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const integrations = await CalendarIntegration.find({ user: userId });
  res.json(integrations);
});

// @desc    Schedule meeting from email
// @route   POST /api/calendar/schedule-meeting
// @access  Private
const scheduleMeeting = asyncHandler(async (req, res) => {
  const { integrationId, title, startTime, endTime, attendees, emailId } = req.body;

  const integration = await CalendarIntegration.findById(integrationId);
  if (!integration) {
    res.status(404);
    throw new Error('Calendar integration not found');
  }

  let eventId;
  switch (integration.provider) {
    case 'google':
      eventId = await scheduleGoogleEvent(integration, { title, startTime, endTime, attendees });
      break;
    default:
      throw new Error('Provider not supported');
  }

  // Save event reference
  integration.events.push({
    eventId,
    title,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    attendees,
    relatedEmail: emailId
  });

  await integration.save();
  res.json({ eventId, integration });
});

// @desc    Get upcoming events
// @route   GET /api/calendar/:id/events
// @access  Private
const getUpcomingEvents = asyncHandler(async (req, res) => {
  const integration = await CalendarIntegration.findById(req.params.id);
  if (!integration) {
    res.status(404);
    throw new Error('Calendar integration not found');
  }

  // Get events from calendar API
  const events = await fetchCalendarEvents(integration);
  res.json(events);
});

// @desc    Sync calendar
// @route   POST /api/calendar/:id/sync
// @access  Private
const syncCalendar = asyncHandler(async (req, res) => {
  const integration = await CalendarIntegration.findById(req.params.id);
  if (!integration) {
    res.status(404);
    throw new Error('Calendar integration not found');
  }

  await fetchCalendarEvents(integration);
  integration.lastSync = new Date();
  await integration.save();

  res.json(integration);
});

// Helper functions
const scheduleGoogleEvent = async (integration, eventData) => {
  const oauth2Client = new google.auth.OAuth2(
    integration.credentials.clientId,
    integration.credentials.clientSecret
  );

  oauth2Client.setCredentials({
    access_token: integration.credentials.accessToken,
    refresh_token: integration.credentials.refreshToken
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event = {
    summary: eventData.title,
    start: { dateTime: eventData.startTime },
    end: { dateTime: eventData.endTime },
    attendees: eventData.attendees.map(email => ({ email }))
  };

  const response = await calendar.events.insert({
    calendarId: integration.credentials.calendarId,
    resource: event
  });

  return response.data.id;
};

const fetchCalendarEvents = async (integration) => {
  // Implementation would fetch events from calendar API
  return integration.events; // Placeholder
};

export {
  connectCalendar,
  getCalendarIntegrations,
  scheduleMeeting,
  getUpcomingEvents,
  syncCalendar
};
