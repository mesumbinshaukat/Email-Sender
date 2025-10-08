import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ShoppingCart, Plus, RefreshCw, Webhook, Settings } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

const EcommerceIntegration = () => {
  const [integrations, setIntegrations] = useState([]);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [formData, setFormData] = useState({
    platform: 'shopify',
    storeName: '',
    apiKey: '',
    storeUrl: ''
  });

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const { data } = await axios.get('/api/ecommerce/integrations');
      setIntegrations(data);
    } catch (error) {
      toast.error('Failed to fetch integrations');
    }
  };

  const connectEcommerce = async () => {
    try {
      const { data } = await axios.post('/api/ecommerce/connect', formData);
      setIntegrations([data, ...integrations]);
      setFormData({ platform: 'shopify', storeName: '', apiKey: '', storeUrl: '' });
      setShowConnectForm(false);
      toast.success('E-commerce platform connected!');
    } catch (error) {
      toast.error('Failed to connect');
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
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            E-commerce Integration
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Connect your store for automated order confirmations and abandoned cart emails
          </p>
        </motion.div>

        <div className="mb-6">
          <button
            onClick={() => setShowConnectForm(!showConnectForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Connect Store
          </button>
        </div>

        {showConnectForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6"
          >
            <h2 className="text-xl font-semibold mb-4">Connect E-commerce Platform</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Platform</label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="shopify">Shopify</option>
                  <option value="woocommerce">WooCommerce</option>
                  <option value="bigcommerce">BigCommerce</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Store Name</label>
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  placeholder="My Store"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Store URL</label>
                <input
                  type="url"
                  value={formData.storeUrl}
                  onChange={(e) => setFormData({ ...formData, storeUrl: e.target.value })}
                  placeholder="https://mystorename.myshopify.com"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">API Key</label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="API Key"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={connectEcommerce}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Connect
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map(integration => (
            <motion.div
              key={integration._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{integration.storeName}</h3>
                  <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                    {integration.platform}
                  </span>
                </div>
                <Webhook className="h-6 w-6 text-green-500" />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Orders Synced:</span>
                  <span className="font-semibold">{integration.syncStats?.ordersSynced || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Products Synced:</span>
                  <span className="font-semibold">{integration.syncStats?.productsSynced || 0}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1">
                  <RefreshCw className="h-4 w-4" />
                  Sync
                </button>
                <button className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700">
                  Settings
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EcommerceIntegration;
