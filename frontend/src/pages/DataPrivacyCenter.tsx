import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Lock, FileText, Download, Trash2, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

interface PrivacyDashboard {
  compliance: any;
  requests: any;
  dataMapping: any;
  settings: any;
  recentRequests: any[];
  auditLog: any[];
}

const DataPrivacyCenter = () => {
  const [dashboard, setDashboard] = useState<PrivacyDashboard | null>(null);
  const [showGDPRForm, setShowGDPRForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [gdprSettings, setGdprSettings] = useState({
    privacyPolicy: '',
    consentMechanism: 'explicit',
    dataRetentionPolicy: {
      personalData: 2555,
      emailData: 1095,
      analyticsData: 730
    }
  });
  const [dataRequest, setDataRequest] = useState({
    type: 'access',
    email: '',
    name: '',
    reason: ''
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await axios.get('/api/privacy/dashboard');
      setDashboard(data);
    } catch (error) {
      toast.error('Failed to fetch privacy dashboard');
    }
  };

  const initializePrivacy = async () => {
    try {
      const { data } = await axios.post('/api/privacy/init');
      setDashboard(data);
      toast.success('Privacy center initialized!');
    } catch (error) {
      toast.error('Failed to initialize privacy center');
    }
  };

  const updateGDPRSettings = async () => {
    try {
      const { data } = await axios.put('/api/privacy/gdpr', gdprSettings);
      setDashboard(data);
      setShowGDPRForm(false);
      toast.success('GDPR settings updated!');
    } catch (error) {
      toast.error('Failed to update GDPR settings');
    }
  };

  const submitDataRequest = async () => {
    try {
      const { data } = await axios.post('/api/privacy/request', dataRequest);
      toast.success(`Data ${dataRequest.type} request submitted! Request ID: ${data.requestId}`);
      setDataRequest({ type: 'access', email: '', name: '', reason: '' });
      setShowRequestForm(false);
      fetchDashboard();
    } catch (error) {
      toast.error('Failed to submit data request');
    }
  };

  const exportData = async () => {
    try {
      const { data } = await axios.get('/api/privacy/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data export downloaded!');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const deleteData = async () => {
    if (!confirm('Are you sure you want to request permanent data deletion? This action cannot be undone.')) return;

    try {
      const { data } = await axios.delete('/api/privacy/data', {
        data: { reason: 'User requested deletion' }
      });
      toast.success('Data deletion request submitted!');
    } catch (error) {
      toast.error('Failed to submit deletion request');
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
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
            <Lock className="h-8 w-8 text-blue-600" />
            Data Privacy Center
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            GDPR compliance, data subject rights, and privacy management
          </p>
        </motion.div>

        {!dashboard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 bg-white rounded-lg shadow mb-8"
          >
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Privacy Center Not Initialized
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Set up your data privacy center to ensure GDPR compliance, manage data subject requests,
              and maintain transparency with your users.
            </p>
            <button
              onClick={initializePrivacy}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Initialize Privacy Center
            </button>
          </motion.div>
        )}

        {dashboard && (
          <>
            {/* Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <button
                onClick={() => setShowGDPRForm(!showGDPRForm)}
                className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <FileText className="h-4 w-4" />
                GDPR Settings
              </button>
              <button
                onClick={() => setShowRequestForm(!showRequestForm)}
                className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Data Request
              </button>
              <button
                onClick={exportData}
                className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Data
              </button>
              <button
                onClick={deleteData}
                className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Data
              </button>
            </div>

            {/* GDPR Settings Form */}
            {showGDPRForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white rounded-lg shadow p-6 mb-6"
              >
                <h2 className="text-xl font-semibold mb-4">GDPR Compliance Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Privacy Policy URL</label>
                    <input
                      type="url"
                      value={gdprSettings.privacyPolicy}
                      onChange={(e) => setGdprSettings({ ...gdprSettings, privacyPolicy: e.target.value })}
                      placeholder="https://example.com/privacy-policy"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Consent Mechanism</label>
                    <select
                      value={gdprSettings.consentMechanism}
                      onChange={(e) => setGdprSettings({ ...gdprSettings, consentMechanism: e.target.value })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="explicit">Explicit Consent</option>
                      <option value="implicit">Implicit Consent</option>
                      <option value="granular">Granular Consent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Personal Data Retention (days)</label>
                    <input
                      type="number"
                      value={gdprSettings.dataRetentionPolicy.personalData}
                      onChange={(e) => setGdprSettings({
                        ...gdprSettings,
                        dataRetentionPolicy: {
                          ...gdprSettings.dataRetentionPolicy,
                          personalData: parseInt(e.target.value)
                        }
                      })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email Data Retention (days)</label>
                    <input
                      type="number"
                      value={gdprSettings.dataRetentionPolicy.emailData}
                      onChange={(e) => setGdprSettings({
                        ...gdprSettings,
                        dataRetentionPolicy: {
                          ...gdprSettings.dataRetentionPolicy,
                          emailData: parseInt(e.target.value)
                        }
                      })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Analytics Data Retention (days)</label>
                    <input
                      type="number"
                      value={gdprSettings.dataRetentionPolicy.analyticsData}
                      onChange={(e) => setGdprSettings({
                        ...gdprSettings,
                        dataRetentionPolicy: {
                          ...gdprSettings.dataRetentionPolicy,
                          analyticsData: parseInt(e.target.value)
                        }
                      })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={updateGDPRSettings}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                  >
                    Update Settings
                  </button>
                  <button
                    onClick={() => setShowGDPRForm(false)}
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            {/* Data Request Form */}
            {showRequestForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white rounded-lg shadow p-6 mb-6"
              >
                <h2 className="text-xl font-semibold mb-4">Submit Data Subject Request</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Request Type</label>
                    <select
                      value={dataRequest.type}
                      onChange={(e) => setDataRequest({ ...dataRequest, type: e.target.value })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="access">Access My Data</option>
                      <option value="rectification">Rectify My Data</option>
                      <option value="erasure">Erase My Data</option>
                      <option value="portability">Data Portability</option>
                      <option value="restriction">Restrict Processing</option>
                      <option value="objection">Object to Processing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      value={dataRequest.email}
                      onChange={(e) => setDataRequest({ ...dataRequest, email: e.target.value })}
                      placeholder="your.email@example.com"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <input
                      type="text"
                      value={dataRequest.name}
                      onChange={(e) => setDataRequest({ ...dataRequest, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Reason (Optional)</label>
                    <textarea
                      value={dataRequest.reason}
                      onChange={(e) => setDataRequest({ ...dataRequest, reason: e.target.value })}
                      placeholder="Please explain why you're making this request..."
                      className="w-full h-24 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={submitDataRequest}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                  >
                    Submit Request
                  </button>
                  <button
                    onClick={() => setShowRequestForm(false)}
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">GDPR Compliance</p>
                    <p className={`text-2xl font-bold ${getComplianceColor(dashboard.compliance.gdpr)}`}>
                      {dashboard.compliance.gdpr}%
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pending Requests</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {dashboard.requests.pending}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Completed Requests</p>
                    <p className="text-2xl font-bold text-green-600">
                      {dashboard.requests.completed}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Requests</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {dashboard.requests.total}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Recent Requests */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-semibold">Recent Data Requests</h2>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {dashboard.recentRequests.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No data requests yet.
                  </div>
                ) : (
                  dashboard.recentRequests.map((request: any) => (
                    <div key={request._id} className="px-6 py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold capitalize">{request.type} Request</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {request.requester.name} ({request.requester.email})
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${getRequestStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DataPrivacyCenter;
