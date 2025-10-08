import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Webhook, Plus, TestTube, Trash2, CheckCircle, XCircle, Code } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

interface WebhookData {
  _id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  deliveryStats: {
    success: number;
    failed: number;
    total: number;
  };
  lastTriggered: string;
}

const APIWebhooks = () => {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [apiDocs, setApiDocs] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    headers: {}
  });

  const availableEvents = [
    'email.sent',
    'email.opened',
    'email.clicked',
    'email.bounced',
    'contact.created',
    'contact.updated',
    'campaign.created',
    'campaign.completed'
  ];

  useEffect(() => {
    fetchWebhooks();
    fetchApiDocs();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const { data } = await axios.get('/api/webhooks');
      setWebhooks(data);
    } catch (error) {
      toast.error('Failed to fetch webhooks');
    }
  };

  const fetchApiDocs = async () => {
    try {
      const { data } = await axios.get('/api/webhooks/docs');
      setApiDocs(data);
    } catch (error) {
      toast.error('Failed to fetch API documentation');
    }
  };

  const createWebhook = async () => {
    if (!formData.name || !formData.url || formData.events.length === 0) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const { data } = await axios.post('/api/webhooks', formData);
      setWebhooks([data.webhook, ...webhooks]);
      setFormData({ name: '', url: '', events: [], headers: {} });
      setShowCreateForm(false);
      toast.success('Webhook created successfully!');
    } catch (error) {
      toast.error('Failed to create webhook');
    }
  };

  const testWebhook = async (webhookId: string) => {
    try {
      const { data } = await axios.post(`/api/webhooks/${webhookId}/test`);
      toast.success(`Test sent! Status: ${data.success ? 'Success' : 'Failed'}`);
      fetchWebhooks(); // Refresh stats
    } catch (error) {
      toast.error('Failed to test webhook');
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      await axios.delete(`/api/webhooks/${webhookId}`);
      setWebhooks(webhooks.filter(w => w._id !== webhookId));
      toast.success('Webhook deleted');
    } catch (error) {
      toast.error('Failed to delete webhook');
    }
  };

  const toggleEvent = (event: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
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
            <Webhook className="h-8 w-8 text-blue-600" />
            API & Webhooks
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Integrate with external systems and automate workflows
          </p>
        </motion.div>

        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Webhook
          </button>
          <button
            onClick={fetchApiDocs}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Code className="h-4 w-4" />
            API Docs
          </button>
        </div>

        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white rounded-lg shadow p-6 mb-6"
          >
            <h2 className="text-xl font-semibold mb-4">Create Webhook</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Webhook Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Order Confirmation Webhook"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Endpoint URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://yourapp.com/webhooks/email-events"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Events to Subscribe</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {availableEvents.map(event => (
                    <label key={event} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event)}
                        onChange={() => toggleEvent(event)}
                        className="rounded"
                      />
                      <span className="text-sm">{event.replace('.', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={createWebhook}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Create Webhook
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Webhooks List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-semibold">Your Webhooks</h2>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {webhooks.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No webhooks configured. Create your first webhook to start receiving real-time events!
                  </div>
                ) : (
                  webhooks.map(webhook => (
                    <div key={webhook._id} className="px-6 py-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{webhook.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {webhook.url}
                          </p>
                          <div className="flex gap-1 mt-1">
                            {webhook.events.slice(0, 3).map(event => (
                              <span key={event} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {event.replace('.', ' ')}
                              </span>
                            ))}
                            {webhook.events.length > 3 && (
                              <span className="text-xs text-gray-500">+{webhook.events.length - 3} more</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {webhook.isActive ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span>Success: {webhook.deliveryStats.success}</span>
                          <span className="mx-2">|</span>
                          <span>Failed: {webhook.deliveryStats.failed}</span>
                          {webhook.lastTriggered && (
                            <>
                              <span className="mx-2">|</span>
                              <span>Last: {new Date(webhook.lastTriggered).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => testWebhook(webhook._id)}
                            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                          >
                            <TestTube className="h-4 w-4" />
                            Test
                          </button>
                          <button
                            onClick={() => deleteWebhook(webhook._id)}
                            className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* API Documentation */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Code className="h-5 w-5" />
                API Documentation
              </h2>

              {apiDocs ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Base Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Version:</span>
                        <span className="font-mono">{apiDocs.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Base URL:</span>
                        <span className="font-mono break-all">{apiDocs.baseUrl}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Available Endpoints</h3>
                    <div className="space-y-4">
                      {Object.entries(apiDocs.endpoints).map(([category, endpoints]: [string, any]) => (
                        <div key={category}>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize mb-2">
                            {category.replace('_', ' ')}
                          </h4>
                          <div className="space-y-1">
                            {Object.entries(endpoints).map(([method, path]: [string, any]) => (
                              <div key={method} className="flex items-center gap-2 text-sm">
                                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                                  {method.toUpperCase()}
                                </span>
                                <span className="font-mono text-blue-600">{path}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Webhook Events</h3>
                    <div className="space-y-2">
                      {apiDocs.webhooks.events.map((event: string) => (
                        <div key={event} className="text-sm bg-gray-50 p-2 rounded">
                          <code className="text-blue-600">{event}</code>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Webhook Payload Format</h3>
                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{JSON.stringify(apiDocs.webhooks.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Loading API documentation...
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default APIWebhooks;
