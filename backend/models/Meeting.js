import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  emailId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Email',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  contactEmail: {
    type: String,
    required: true,
  },
  contactName: String,
  intent: {
    type: String,
    enum: ['meeting_request', 'call_request', 'demo_request', 'consultation', 'follow_up'],
    required: true,
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true,
  },
  suggestedTimes: [{
    date: Date,
    time: String,
    duration: { type: Number, default: 30 }, // minutes
    timezone: String,
    available: { type: Boolean, default: true },
    booked: { type: Boolean, default: false },
  }],
  selectedTime: {
    date: Date,
    time: String,
    duration: Number,
    timezone: String,
  },
  calendarIntegration: {
    provider: { type: String, enum: ['google', 'outlook', 'manual'] },
    eventId: String,
    calendarId: String,
    inviteSent: { type: Boolean, default: false },
  },
  meetingDetails: {
    title: String,
    description: String,
    location: { type: String, enum: ['zoom', 'google_meet', 'teams', 'phone', 'in_person'] },
    meetingLink: String,
    phoneNumber: String,
    address: String,
  },
  status: {
    type: String,
    enum: ['detected', 'suggested', 'scheduled', 'confirmed', 'completed', 'cancelled'],
    default: 'detected',
  },
  followUpEmail: {
    sent: { type: Boolean, default: false },
    sentAt: Date,
    emailId: { type: mongoose.Schema.Types.ObjectId, ref: 'Email' },
  },
  aiAnalysis: {
    detectedAt: Date,
    analysis: String,
    keyPhrases: [String],
    urgency: { type: String, enum: ['low', 'medium', 'high'] },
  },
}, {
  timestamps: true,
});

// Indexes
meetingSchema.index({ userId: 1, createdAt: -1 });
meetingSchema.index({ status: 1 });
meetingSchema.index({ 'selectedTime.date': 1 });

// Virtual for meeting URL
meetingSchema.virtual('meetingUrl').get(function() {
  if (this.meetingDetails?.meetingLink) {
    return this.meetingDetails.meetingLink;
  }
  // Generate meeting URL based on location
  switch (this.meetingDetails?.location) {
    case 'zoom':
      return `https://zoom.us/j/${Math.random().toString(36).substr(2, 9)}`;
    case 'google_meet':
      return `https://meet.google.com/${Math.random().toString(36).substr(2, 3)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 3)}`;
    case 'teams':
      return `https://teams.microsoft.com/l/meetup-join/${Math.random().toString(36).substr(2, 9)}`;
    default:
      return null;
  }
});

// Method to generate calendar invite
meetingSchema.methods.generateCalendarInvite = function() {
  const startTime = new Date(this.selectedTime.date);
  const [hours, minutes] = this.selectedTime.time.split(':');
  startTime.setHours(parseInt(hours), parseInt(minutes));

  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + (this.selectedTime.duration || 30));

  return {
    title: this.meetingDetails?.title || `Meeting with ${this.contactName || this.contactEmail}`,
    description: this.meetingDetails?.description || 'Meeting scheduled via AI Meeting Scheduler',
    startTime,
    endTime,
    location: this.meetingDetails?.meetingLink || this.meetingDetails?.address || '',
    attendees: [this.contactEmail],
  };
};

const Meeting = mongoose.model('Meeting', meetingSchema);

export default Meeting;
