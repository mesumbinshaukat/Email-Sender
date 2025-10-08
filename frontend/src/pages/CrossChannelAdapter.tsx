import { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Shuffle, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

const CrossChannelAdapter = () => {
  const [emailJourney, setEmailJourney] = useState('');
  const [targetChannel, setTargetChannel] = useState('SMS');
  const [adaptedJourney, setAdaptedJourney] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const adaptJourney = async () => {
    if (!emailJourney) {
      toast.error('Please describe email journey');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/cross-channel/adapt', {
        emailJourney: JSON.parse(emailJourney),
        targetChannel
      });
      setAdaptedJourney(data);
      toast.success('Journey adapted');
    } catch (error) {
      toast.error('Failed to adapt journey');
    } finally {
      setLoading(false);
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
            <Shuffle className="h-8 w-8 text-blue-600" />
            Cross-Channel Journey AI Adapter
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            AI adapts email journeys to SMS, push, and other channels
          </p>
        </motion.div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Adapt Journey</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Journey (JSON)</label>
                <textarea
                  value={emailJourney}
                  onChange={(e) => setEmailJourney(e.target.value)}
                  rows={6}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder='[{"step": "Welcome", "content": "Welcome email"}, {"step": "Follow-up", "content": "Check-in"}]'
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Target Channel</label>
                <select
                  value={targetChannel}
                  onChange={(e) => setTargetChannel(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SMS">SMS</option>
                  <option value="Push">Push Notification</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Social">Social Media</option>
                </select>
              </div>
              <button
                onClick={adaptJourney}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? 'Adapting...' : 'Adapt Journey'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {adaptedJourney && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Adapted {targetChannel} Journey</h2>
              <div className="space-y-4">
                {adaptedJourney.steps?.map((step: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="font-semibold">{step.step}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{step.content}</p>
                    <p className="text-xs text-gray-500 mt-1">Channel: {targetChannel}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CrossChannelAdapter;
