import mongoose from 'mongoose';

const calendarIntegrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: String,
    enum: ['google', 'outlook', 'apple', 'zoom'],
    required: true
  },
  name: String,
  credentials: {
    accessToken: String,
    refreshToken: String,
    clientId: String,
    clientSecret: String,
    calendarId: String
  },
  settings: {
    autoScheduleEmails: { type: Boolean, default: true },
    meetingReminders: { type: Boolean, default: true },
    syncContacts: { type: Boolean, default: false },
    timeZone: String
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'error'],
    default: 'disconnected'
  },
  events: [{
    eventId: String,
    title: String,
    startTime: Date,
    endTime: Date,
    attendees: [String],
    relatedEmail: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Email'
    }
  }],
  lastSync: Date
}, {
  timestamps: true
});

const CalendarIntegration = mongoose.model('CalendarIntegration', calendarIntegrationSchema);

export default CalendarIntegration;
