import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from '../lib/axios';
import { motion } from 'framer-motion';
import { Zap, Plus, BarChart3, TestTube } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

interface Trigger {
  _id: string;
  name: string;
  type: string;
  conditions: any;
  actions: any[];
  isActive: boolean;
  workflow?: any;
}

const SmartTriggers = () => {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'email_open',
    conditions: {},
    actions: []
  });

  useEffect(() => {
    fetchTriggers();
  }, []);

  const fetchTriggers = async () => {
    try {
      const { data } = await axios.get('/api/triggers');
      const payload = (data?.data ?? data) as any;
      setTriggers(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setTriggers([]);
      toast.error('Failed to fetch triggers');
    }
  };

  const createTrigger = async () => {
    if (!formData.name) {
      toast.error('Please enter trigger name');
      return;
    }

    try {
      const { data } = await axios.post('/api/triggers/smart', formData);
      const created = (data?.data ?? data) as any;
      setTriggers([created, ...triggers]);
      toast.success('Trigger created successfully!');
      setFormData({ name: '', type: 'email_open', conditions: {}, actions: [] });
      setShowCreateForm(false);
    } catch (error) {
      toast.error('Failed to create trigger');
    }
  };

  const toggleTrigger = async (triggerId: string, isActive: boolean) => {
    try {
      await axios.put(`/api/triggers/${triggerId}`, { isActive: !isActive });
      setTriggers(triggers.map(t =>
        t._id === triggerId ? { ...t, isActive: !isActive } : t
      ));
      toast.success(`Trigger ${!isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update trigger');
    }
  };

  const fireEvent = async (eventType: string) => {
    try {
      const { data } = await axios.post('/api/triggers/fire-event', { eventType });
      toast.success(`Event fired! ${data.triggered} triggers activated`);
    } catch (error) {
      toast.error('Failed to fire event');
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
            <Zap className="h-8 w-8 text-blue-600" />
            Smart Triggers
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Automate actions based on user behavior and events
          </p>
        </motion.div>

        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Trigger
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => fireEvent('email_open')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
            >
              Simulate Email Open
            </button>
            <button
              onClick={() => fireEvent('website_visit')}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm"
            >
              Simulate Website Visit
            </button>
          </div>
        </div>

        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white rounded-lg shadow p-6 mb-6"
          >
            <h2 className="text-xl font-semibold mb-4">Create Smart Trigger</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Trigger Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="E.g., Welcome Email Follow-up"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Event Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="email_open">Email Opened</option>
                  <option value="email_click">Email Clicked</option>
                  <option value="website_visit">Website Visited</option>
                  <option value="form_submit">Form Submitted</option>
                  <option value="time_based">Time Based</option>
                  <option value="custom">Custom Event</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createTrigger}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Create Trigger
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {triggers.map(trigger => (
            <motion.div
              key={trigger._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{trigger.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {trigger.type.replace('_', ' ')}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  trigger.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                    : 'bg-gray-100 text-gray-800 dark:text-gray-100'
                }`}>
                  {trigger.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm">
                  <span className="font-medium">Conditions:</span> {Object.keys(trigger.conditions).length || 'None'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Actions:</span> {trigger.actions.length}
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => toggleTrigger(trigger._id, trigger.isActive)}
                  className={`px-3 py-1 text-xs rounded ${
                    trigger.isActive
                      ? 'bg-red-100 text-red-800 hover:bg-red-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {trigger.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => toast.success('Analytics coming soon!')}
                  className="px-3 py-1 text-xs rounded bg-blue-100 text-blue-800 hover:bg-blue-200 flex items-center gap-1"
                >
                  <BarChart3 className="h-3 w-3" />
                  Analytics
                </button>
                <button
                  onClick={() => toast.success('Test functionality coming soon!')}
                  className="px-3 py-1 text-xs rounded bg-purple-100 text-purple-800 hover:bg-purple-200 flex items-center gap-1"
                >
                  <TestTube className="h-3 w-3" />
                  Test
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {triggers.length === 0 && (
          <div className="text-center py-12">
            <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No triggers yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first smart trigger to automate email workflows
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Trigger
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SmartTriggers;
