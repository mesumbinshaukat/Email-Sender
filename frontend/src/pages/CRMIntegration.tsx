import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Building, Plus, RefreshCw, CheckCircle, XCircle, Settings } from 'lucide-react';

interface CRMIntegration {
  _id: string;
  provider: string;
  name: string;
  status: string;
  lastSync: string;
  syncStats: {
    contactsSynced: number;
    dealsSynced: number;
  };
}

const CRMIntegration = () => {
  const [integrations, setIntegrations] = useState<CRMIntegration[]>([]);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [formData, setFormData] = useState({
    provider: 'hubspot',
    name: '',
    apiKey: '',
    settings: {
      syncContacts: true,
      syncDeals: true
    }
  });

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const { data } = await axios.get('/api/crm/integrations');
      setIntegrations(data);
    } catch (error) {
      toast.error('Failed to fetch CRM integrations');
    }
  };

  const connectCRM = async () => {
    if (!formData.name) {
      toast.error('Please enter integration name');
      return;
    }

    setConnecting(true);
    try {
      const { data } = await axios.post('/api/crm/connect', {
        provider: formData.provider,
        name: formData.name,
        credentials: { apiKey: formData.apiKey },
        settings: formData.settings
      });

      setIntegrations([data, ...integrations]);
      setFormData({ provider: 'hubspot', name: '', apiKey: '', settings: { syncContacts: true, syncDeals: true } });
      setShowConnectForm(false);
      toast.success('CRM connected successfully!');
    } catch (error) {
      toast.error('Failed to connect CRM');
    } finally {
      setConnecting(false);
    }
  };

  const syncCRM = async (integrationId: string) => {
    try {
      await axios.post(`/api/crm/${integrationId}/sync`);
      toast.success('Sync initiated!');
      // Refresh integrations after a delay
      setTimeout(fetchIntegrations, 3000);
    } catch (error) {
      toast.error('Failed to sync CRM');
    }
  };

  const disconnectCRM = async (integrationId: string) => {
    if (!confirm('Are you sure you want to disconnect this CRM?')) return;

    try {
      await axios.delete(`/api/crm/${integrationId}`);
      setIntegrations(integrations.filter(i => i._id !== integrationId));
      toast.success('CRM disconnected');
    } catch (error) {
      toast.error('Failed to disconnect CRM');
    }
  };

  const getProviderColor = (provider: string) => {
    const colors = {
      hubspot: 'bg-orange-100 text-orange-800',
      salesforce: 'bg-blue-100 text-blue-800',
      pipedrive: 'bg-green-100 text-green-800',
      zoho: 'bg-purple-100 text-purple-800'
    };
    return colors[provider] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <RefreshCw className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Building className="h-8 w-8 text-blue-600" />
            CRM Integration
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Connect your CRM to sync contacts, deals, and track customer journeys
          </p>
        </motion.div>

        <div className="mb-6">
          <button
            onClick={() => setShowConnectForm(!showConnectForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Connect CRM
          </button>
        </div>

        {showConnectForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6"
          >
            <h2 className="text-xl font-semibold mb-4">Connect CRM Platform</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">CRM Provider</label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="hubspot">HubSpot</option>
                  <option value="salesforce">Salesforce</option>
                  <option value="pipedrive">Pipedrive</option>
                  <option value="zoho">Zoho CRM</option>
                  <option value="activecampaign">ActiveCampaign</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Integration Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My HubSpot Integration"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">API Key</label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="Enter your API key"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Sync Settings</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.settings.syncContacts}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: { ...formData.settings, syncContacts: e.target.checked }
                      })}
                      className="rounded"
                    />
                    Sync Contacts
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.settings.syncDeals}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: { ...formData.settings, syncDeals: e.target.checked }
                      })}
                      className="rounded"
                    />
                    Sync Deals
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={connectCRM}
                disabled={connecting}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {connecting ? 'Connecting...' : 'Connect CRM'}
              </button>
              <button
                onClick={() => setShowConnectForm(false)}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map(integration => (
            <motion.div
              key={integration._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{integration.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded ${getProviderColor(integration.provider)}`}>
                    {integration.provider}
                  </span>
                </div>
                {getStatusIcon(integration.status)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Contacts Synced:</span>
                  <span className="font-semibold">{integration.syncStats?.contactsSynced || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Deals Synced:</span>
                  <span className="font-semibold">{integration.syncStats?.dealsSynced || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Last Sync:</span>
                  <span className="font-semibold">
                    {integration.lastSync ? new Date(integration.lastSync).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => syncCRM(integration._id)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Sync
                </button>
                <button
                  onClick={() => disconnectCRM(integration._id)}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
                >
                  Disconnect
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {integrations.length === 0 && (
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No CRM integrations
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Connect your CRM to automatically sync contacts and deals
            </p>
            <button
              onClick={() => setShowConnectForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Connect CRM
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CRMIntegration;
