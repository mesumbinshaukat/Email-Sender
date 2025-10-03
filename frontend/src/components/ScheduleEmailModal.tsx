import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, Zap, TrendingUp } from 'lucide-react';
import { Button } from './ui/Button';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

interface TimeSuggestion {
  time: string;
  label: string;
  confidence: number;
  reasoning: string;
}

interface ScheduleEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailData: {
    subject: string;
    recipients: { to: string[]; cc?: string[]; bcc?: string[] };
    body: { html: string; text: string };
    campaignId?: string;
  };
  onScheduled: (scheduledEmail: any) => void;
}

export const ScheduleEmailModal: React.FC<ScheduleEmailModalProps> = ({
  isOpen,
  onClose,
  emailData,
  onScheduled,
}) => {
  const [suggestions, setSuggestions] = useState<TimeSuggestion[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customTime, setCustomTime] = useState('');
  const [timezone, setTimezone] = useState('');
  const [loading, setLoading] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    if (isOpen && emailData.recipients.to.length > 0) {
      // Detect user's timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(userTimezone);
      
      // Fetch optimal times
      fetchOptimalTimes(emailData.recipients.to[0], userTimezone);
    }
  }, [isOpen, emailData.recipients.to]);

  const fetchOptimalTimes = async (recipientEmail: string, tz: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`/scheduler/optimal-times/${recipientEmail}`, {
        params: { timezone: tz },
      });

      if (response.data.success) {
        setSuggestions(response.data.suggestions);
        // Auto-select first suggestion
        if (response.data.suggestions.length > 0) {
          setSelectedTime(response.data.suggestions[0].time);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch optimal times:', error);
      toast.error('Failed to load scheduling suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    const timeToSchedule = selectedTime === 'custom' ? customTime : selectedTime;

    if (!timeToSchedule) {
      toast.error('Please select a time to schedule');
      return;
    }

    setScheduling(true);
    try {
      const response = await axios.post('/scheduler/schedule-email', {
        ...emailData,
        timezone,
        scheduledTime: timeToSchedule,
      });

      if (response.data.success) {
        toast.success(`Email scheduled for ${new Date(response.data.email.scheduledAt).toLocaleString()}`);
        onScheduled(response.data.email);
        onClose();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to schedule email');
    } finally {
      setScheduling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Clock className="h-6 w-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">Schedule Email</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Email Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">To: {emailData.recipients.to.join(', ')}</p>
            <p className="font-semibold text-gray-900">{emailData.subject}</p>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="America/New_York"
            />
            <p className="text-xs text-gray-500 mt-1">
              IANA timezone (e.g., America/New_York, Europe/London)
            </p>
          </div>

          {/* AI Suggestions */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Analyzing optimal send times...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Zap className="inline h-4 w-4 mr-1 text-yellow-500" />
                AI-Recommended Times
              </label>

              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedTime(suggestion.time)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedTime === suggestion.time
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-gray-900">{suggestion.label}</span>
                        <span className="text-sm text-gray-600">
                          {new Date(suggestion.time).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{suggestion.reasoning}</p>
                    </div>
                    <div className="flex items-center space-x-1 ml-4">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        {Math.round(suggestion.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Custom Time Option */}
              <div
                onClick={() => setSelectedTime('custom')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedTime === 'custom'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <span className="font-semibold text-gray-900">Custom Time</span>
                </div>
                {selectedTime === 'custom' && (
                  <input
                    type="datetime-local"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={scheduling}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} isLoading={scheduling} disabled={loading}>
            <Clock className="h-4 w-4 mr-2" />
            Schedule Email
          </Button>
        </div>
      </div>
    </div>
  );
};
