import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Video, Phone, MapPin, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

interface Meeting {
  _id: string;
  contactEmail: string;
  contactName?: string;
  intent: string;
  confidence: number;
  status: 'detected' | 'suggested' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  suggestedTimes: Array<{
    date: string;
    time: string;
    duration: number;
    timezone: string;
    available: boolean;
    booked: boolean;
  }>;
  selectedTime?: {
    date: string;
    time: string;
    duration: number;
    timezone: string;
  };
  meetingDetails?: {
    title: string;
    description: string;
    location: 'zoom' | 'google_meet' | 'teams' | 'phone' | 'in_person';
    meetingLink?: string;
    phoneNumber?: string;
    address?: string;
  };
  aiAnalysis: {
    detectedAt: string;
    analysis: string;
    keyPhrases: string[];
    urgency: 'low' | 'medium' | 'high';
  };
  calendarIntegration: {
    inviteSent: boolean;
  };
  createdAt: string;
}

interface TimeSlot {
  date: string;
  time: string;
  duration: number;
  timezone: string;
  available: boolean;
}

export const AIMeetingScheduler: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState({
    title: '',
    description: '',
    location: 'zoom' as const,
    duration: 30,
  });

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await axios.get('/meetings');
      setMeetings(response.data.data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (date?: string) => {
    try {
      const params = date ? { date } : {};
      const response = await axios.get('/meetings/available-slots', { params });
      setAvailableSlots(response.data.data);
    } catch (error) {
      console.error('Error fetching available slots:', error);
    }
  };

  const detectMeetingIntent = async (emailId: string, content: string) => {
    try {
      await axios.post('/meetings/detect-intent', {
        emailId,
        content,
      });
      toast.success('AI is analyzing for meeting requests...');
      await fetchMeetings();
    } catch (error) {
      console.error('Error detecting meeting intent:', error);
      toast.error('Failed to analyze meeting intent');
    }
  };

  const scheduleMeeting = async (meetingId: string, selectedTime: TimeSlot) => {
    try {
      await axios.post('/meetings/schedule', {
        meetingId,
        selectedTime,
        meetingDetails,
      });
      toast.success('Meeting scheduled successfully!');
      setShowScheduler(false);
      setSelectedMeeting(null);
      await fetchMeetings();
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      toast.error('Failed to schedule meeting');
    }
  };

  const sendCalendarInvite = async (meetingId: string) => {
    try {
      await axios.post('/meetings/send-invite', {
        meetingId,
      });
      toast.success('Calendar invite sent!');
      await fetchMeetings();
    } catch (error) {
      console.error('Error sending calendar invite:', error);
      toast.error('Failed to send calendar invite');
    }
  };

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'meeting_request': return '📅';
      case 'call_request': return '📞';
      case 'demo_request': return '🎯';
      case 'consultation': return '💼';
      case 'follow_up': return '🔄';
      default: return '💬';
    }
  };

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'zoom': return <Video className="h-4 w-4" />;
      case 'google_meet': return <Video className="h-4 w-4" />;
      case 'teams': return <Video className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'in_person': return <MapPin className="h-4 w-4" />;
      default: return <Video className="h-4 w-4" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AI Meeting Scheduler
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Automatically detect meeting requests and schedule meetings with AI assistance
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{meetings.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {meetings.filter(m => m.status === 'scheduled' || m.status === 'confirmed').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {meetings.filter(m => m.status === 'detected' || m.status === 'suggested').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Confidence</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {meetings.filter(m => m.confidence > 0.8).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meetings List */}
        <div className="space-y-4">
          {meetings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No meetings detected yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                  The AI will automatically detect meeting requests from incoming emails and suggest scheduling options.
                </p>
                <Button onClick={() => toast.info('AI monitoring is always active for new emails')}>
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ) : (
            meetings.map((meeting) => (
              <Card key={meeting._id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{getIntentIcon(meeting.intent)}</span>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            Meeting with {meeting.contactName || meeting.contactEmail}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {meeting.aiAnalysis.analysis}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm mb-3">
                        <Badge className={getUrgencyColor(meeting.aiAnalysis.urgency)}>
                          {meeting.aiAnalysis.urgency} urgency
                        </Badge>
                        <span className="text-gray-500">
                          Confidence: {Math.round(meeting.confidence * 100)}%
                        </span>
                        <span className="text-gray-500">
                          {new Date(meeting.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {meeting.selectedTime && (
                        <div className="flex items-center space-x-2 text-sm text-green-600 mb-3">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Scheduled: {new Date(meeting.selectedTime.date).toLocaleDateString()} at {meeting.selectedTime.time}
                          </span>
                          {meeting.meetingDetails?.location && getLocationIcon(meeting.meetingDetails.location)}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {meeting.aiAnalysis.keyPhrases.slice(0, 3).map((phrase, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {phrase}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Badge
                        className={
                          meeting.status === 'scheduled' ? 'bg-green-100 text-green-800 border-green-200' :
                          meeting.status === 'confirmed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }
                      >
                        {meeting.status}
                      </Badge>

                      {meeting.status === 'detected' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedMeeting(meeting);
                            setShowScheduler(true);
                            fetchAvailableSlots();
                          }}
                        >
                          Schedule
                        </Button>
                      )}

                      {meeting.status === 'scheduled' && !meeting.calendarIntegration.inviteSent && (
                        <Button
                          size="sm"
                          onClick={() => sendCalendarInvite(meeting._id)}
                        >
                          Send Invite
                        </Button>
                      )}

                      {meeting.status === 'scheduled' && meeting.calendarIntegration.inviteSent && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Invite Sent
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Meeting Scheduler Modal */}
        {showScheduler && selectedMeeting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Schedule Meeting</h2>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowScheduler(false);
                      setSelectedMeeting(null);
                    }}
                  >
                    Close
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Meeting Details */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Meeting Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input
                          type="text"
                          value={meetingDetails.title}
                          onChange={(e) => setMeetingDetails(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Meeting title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                        <select
                          value={meetingDetails.duration}
                          onChange={(e) => setMeetingDetails(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={45}>45 minutes</option>
                          <option value={60}>60 minutes</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                          value={meetingDetails.description}
                          onChange={(e) => setMeetingDetails(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          placeholder="Meeting description"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Location</label>
                        <select
                          value={meetingDetails.location}
                          onChange={(e) => setMeetingDetails(prev => ({ ...prev, location: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="zoom">Zoom</option>
                          <option value="google_meet">Google Meet</option>
                          <option value="teams">Microsoft Teams</option>
                          <option value="phone">Phone Call</option>
                          <option value="in_person">In Person</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Available Time Slots */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Available Time Slots</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                      {availableSlots.filter(slot => slot.available).slice(0, 9).map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => scheduleMeeting(selectedMeeting._id, slot)}
                          className="p-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
                        >
                          <div className="font-medium">{slot.time}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(slot.date).toLocaleDateString()}
                          </div>
                        </button>
                      ))}
                    </div>
                    {availableSlots.filter(slot => slot.available).length === 0 && (
                      <p className="text-gray-500 text-center py-4">
                        No available slots found. Try a different date.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};
