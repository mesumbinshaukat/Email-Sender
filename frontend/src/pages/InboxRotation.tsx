import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Mail, RotateCcw, TrendingUp, Shield, Plus } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

interface Inbox {
  _id: string;
  email: string;
  provider: string;
  status: string;
  warmupLevel: number;
  reputationScore: number;
  currentDailySends: number;
  dailySendLimit: number;
}

const InboxRotation = () => {
  const [inboxes, setInboxes] = useState<Inbox[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [rotationRecommendation, setRotationRecommendation] = useState('');

  useEffect(() => {
    fetchInboxes();
  }, []);

  const fetchInboxes = async () => {
    try {
      const { data } = await axios.get('/api/inbox-rotation');
      setInboxes(data);
    } catch (error) {
      toast.error('Failed to fetch inboxes');
    }
  };

  const addInbox = async (formData: Record<string, any>) => {
    try {
      const response = await axios.post('/api/inbox-rotation', formData);
      setInboxes([...inboxes, response.data]);
      setShowAddForm(false);
      toast.success('Inbox added successfully');
    } catch (error) {
      toast.error('Failed to add inbox');
    }
  };

  const startWarmup = async (inboxId: string) => {
    try {
      await axios.post(`/api/inbox-rotation/${inboxId}/warmup`);
      toast.success('Warmup started');
      fetchInboxes();
    } catch (error) {
      toast.error('Failed to start warmup');
    }
  };

  const getRecommendation = async () => {
    try {
      const response = await axios.get('/api/inbox-rotation/rotation/recommend');
      setRotationRecommendation(response.data.recommendation);
    } catch (error) {
      toast.error('Failed to get recommendation');
    }
  };

  const testInbox = async (inboxId: string) => {
    try {
      await axios.get(`/api/inbox-rotation/${inboxId}/test`);
      toast.success('Inbox connection successful');
    } catch (error) {
      toast.error('Inbox connection failed');
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
            <RotateCcw className="h-8 w-8 text-blue-600" />
            Inbox Rotation & Dual Warmup AI
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Automatically rotate sends across multiple inboxes with AI-powered dual warmup algorithms
          </p>
        </motion.div>

        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Inbox
          </button>
          <button
            onClick={getRecommendation}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            Get Rotation Recommendation
          </button>
        </div>

        {rotationRecommendation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mb-6"
          >
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">AI Rotation Recommendation:</h3>
            <p className="text-blue-700 dark:text-blue-300">{rotationRecommendation}</p>
          </motion.div>
        )}

        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white rounded-lg shadow p-6 mb-6"
          >
            <h2 className="text-xl font-semibold mb-4">Add New Inbox</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              addInbox({
                email: formData.get('email') as string,
                password: formData.get('password') as string,
                provider: formData.get('provider') as string,
                smtpHost: formData.get('smtpHost') as string,
                smtpPort: formData.get('smtpPort') as string,
                imapHost: formData.get('imapHost') as string,
                imapPort: formData.get('imapPort') as string
              });
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    name="email"
                    type="email"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    name="password"
                    type="password"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Provider</label>
                  <select
                    name="provider"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="gmail">Gmail</option>
                    <option value="outlook">Outlook</option>
                    <option value="yahoo">Yahoo</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">SMTP Host</label>
                  <input
                    name="smtpHost"
                    placeholder="smtp.gmail.com"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">SMTP Port</label>
                  <input
                    name="smtpPort"
                    type="number"
                    defaultValue="587"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">IMAP Host</label>
                  <input
                    name="imapHost"
                    placeholder="imap.gmail.com"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">IMAP Port</label>
                  <input
                    name="imapPort"
                    type="number"
                    defaultValue="993"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                  Add Inbox
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Connected Inboxes</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {inboxes.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                No inboxes connected yet. Add your first inbox above!
              </div>
            ) : (
              inboxes.map(inbox => (
                <div key={inbox._id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4" />
                        <h3 className="font-semibold">{inbox.email}</h3>
                        <span className={`px-2 py-1 text-xs rounded ${
                          inbox.status === 'active' ? 'bg-green-100 text-green-800' :
                          inbox.status === 'warming' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {inbox.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Warmup:</span> {inbox.warmupLevel}%
                        </div>
                        <div>
                          <span className="font-medium">Reputation:</span> {inbox.reputationScore}/100
                        </div>
                        <div>
                          <span className="font-medium">Daily Sends:</span> {inbox.currentDailySends}/{inbox.dailySendLimit}
                        </div>
                        <div>
                          <span className="font-medium">Provider:</span> {inbox.provider}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => testInbox(inbox._id)}
                        className="text-blue-600 hover:text-blue-700 text-sm px-3 py-1 border border-blue-600 rounded"
                      >
                        Test
                      </button>
                      {inbox.status !== 'warming' && (
                        <button
                          onClick={() => startWarmup(inbox._id)}
                          className="text-green-600 hover:text-green-700 text-sm px-3 py-1 border border-green-600 rounded flex items-center gap-1"
                        >
                          <TrendingUp className="h-3 w-3" />
                          Warmup
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

export default InboxRotation;
