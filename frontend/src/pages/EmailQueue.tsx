import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, Trash2, Edit, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

interface QueuedEmail {
  id: string;
  subject: string;
  recipients: {
    to: string[];
    cc?: string[];
    bcc?: string[];
  };
  scheduledAt: string;
  queueJobId: string;
  jobStatus: string;
  schedulingMetadata: {
    optimalTime: string;
    timezone: string;
    aiConfidence: number;
    engagementScore: number;
    fallbackReason?: string;
  };
  createdAt: string;
}

export const EmailQueue: React.FC = () => {
  const [queue, setQueue] = useState<QueuedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/scheduler/queue');
      if (response.data.success) {
        setQueue(response.data.queue);
      }
    } catch (error: any) {
      toast.error('Failed to load email queue');
      console.error('Queue fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchQueue();
    setRefreshing(false);
    toast.success('Queue refreshed');
  };

  const handleReschedule = async (emailId: string) => {
    const newTime = prompt('Enter new scheduled time (ISO format):');
    if (!newTime) return;

    try {
      const response = await axios.put(`/scheduler/reschedule/${emailId}`, {
        newTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      if (response.data.success) {
        toast.success('Email rescheduled successfully');
        fetchQueue();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reschedule email');
    }
  };

  const handleCancel = async (emailId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled email?')) return;

    try {
      await axios.delete(`/emails/${emailId}`);
      toast.success('Scheduled email cancelled');
      fetchQueue();
    } catch (error: any) {
      toast.error('Failed to cancel email');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      waiting: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Queued' },
      active: { color: 'bg-yellow-100 text-yellow-800', icon: RefreshCw, label: 'Processing' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Sent' },
      failed: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Failed' },
      delayed: { color: 'bg-orange-100 text-orange-800', icon: Clock, label: 'Delayed' },
    };

    const config = statusConfig[status] || statusConfig.waiting;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Queue</h1>
            <p className="text-gray-600 mt-2">Manage your scheduled emails</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
            <RefreshCw className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Scheduled Emails ({queue.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-gray-600">Loading queue...</span>
              </div>
            ) : queue.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No scheduled emails</p>
                <p className="text-sm text-gray-500 mt-1">
                  Schedule emails from the Send Email page
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {queue.map((email) => (
                  <div
                    key={email.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{email.subject}</h3>
                          {getStatusBadge(email.jobStatus)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">To:</span>
                            <span>{email.recipients.to.join(', ')}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">Scheduled:</span>
                            <span>{new Date(email.scheduledAt).toLocaleString()}</span>
                          </div>

                          {email.schedulingMetadata && (
                            <>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">Timezone:</span>
                                <span>{email.schedulingMetadata.timezone}</span>
                              </div>

                              <div className="flex items-center space-x-2">
                                <span className="font-medium">AI Confidence:</span>
                                <span className="text-green-600 font-medium">
                                  {Math.round(email.schedulingMetadata.aiConfidence * 100)}%
                                </span>
                              </div>
                            </>
                          )}

                          {email.schedulingMetadata?.fallbackReason && (
                            <div className="col-span-2 flex items-center space-x-2 text-yellow-700">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-xs">{email.schedulingMetadata.fallbackReason}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReschedule(email.id)}
                          disabled={email.jobStatus === 'completed' || email.jobStatus === 'failed'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancel(email.id)}
                          disabled={email.jobStatus === 'completed' || email.jobStatus === 'failed'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};
