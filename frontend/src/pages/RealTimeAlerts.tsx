import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Bell, Plus, AlertTriangle, CheckCircle, XCircle, Settings } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

interface Alert {
  _id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  status: string;
  channels: string[];
  createdAt: string;
}

const RealTimeAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'email_bounce',
    title: '',
    message: '',
    severity: 'medium',
    channels: [] as string[]
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data } = await axios.get('/api/alerts');
      setAlerts(data);
    } catch (error) {
      toast.error('Failed to fetch alerts');
    }
  };

  const createAlert = async () => {
    if (!formData.title || !formData.message) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const { data } = await axios.post('/api/alerts/create', formData);
      setAlerts([data, ...alerts]);
      setFormData({ type: 'email_bounce', title: '', message: '', severity: 'medium', channels: [] });
      setShowCreateForm(false);
      toast.success('Alert created successfully!');
    } catch (error) {
      toast.error('Failed to create alert');
    }
  };

  const updateAlertStatus = async (alertId: string, status: string) => {
    try {
      await axios.put(`/api/alerts/${alertId}/status`, { status });
      setAlerts(alerts.map(alert =>
        alert._id === alertId ? { ...alert, status } : alert
      ));
      toast.success(`Alert ${status}`);
    } catch (error) {
      toast.error('Failed to update alert');
    }
  };

  const sendTestAlert = async () => {
    try {
      await axios.post('/api/alerts/test', { channels: ['email'] });
      toast.success('Test alert sent!');
    } catch (error) {
      toast.error('Failed to send test alert');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'acknowledged': return <CheckCircle className="h-4 w-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Bell className="h-8 w-8 text-blue-600" />
            Real-Time Alerts
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor your email campaigns and get instant notifications
          </p>
        </motion.div>

        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Alert
          </button>
          <button
            onClick={sendTestAlert}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Send Test Alert
          </button>
        </div>

        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6"
          >
            <h2 className="text-xl font-semibold mb-4">Create Alert Rule</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Alert Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="email_bounce">Email Bounce</option>
                  <option value="low_open_rate">Low Open Rate</option>
                  <option value="unusual_traffic">Unusual Traffic</option>
                  <option value="goal_achieved">Goal Achieved</option>
                  <option value="system_error">System Error</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Severity</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Alert title"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Alert message"
                  className="w-full h-24 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Notification Channels</label>
                <div className="flex gap-4">
                  {['email', 'slack', 'webhook', 'sms'].map(channel => (
                    <label key={channel} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.channels.includes(channel)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...formData.channels, channel]
                            : formData.channels.filter(c => c !== channel);
                          setFormData({ ...formData, channels: updated });
                        }}
                        className="rounded"
                      />
                      {channel.charAt(0).toUpperCase() + channel.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={createAlert}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Create Alert
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Active Alerts</h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {alerts.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                No alerts configured. Create your first alert to start monitoring.
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert._id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(alert.status)}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {alert.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                          <span>{alert.type.replace('_', ' ')}</span>
                          <span>{new Date(alert.createdAt).toLocaleDateString()}</span>
                          <span>Channels: {alert.channels.join(', ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {alert.status === 'active' && (
                        <button
                          onClick={() => updateAlertStatus(alert._id, 'acknowledged')}
                          className="text-yellow-600 hover:text-yellow-700 text-sm"
                        >
                          Acknowledge
                        </button>
                      )}
                      {alert.status === 'acknowledged' && (
                        <button
                          onClick={() => updateAlertStatus(alert._id, 'resolved')}
                          className="text-green-600 hover:text-green-700 text-sm"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
    </div>
      </DashboardLayout>
  );
};

export default RealTimeAlerts;
