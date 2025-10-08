import { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Send, Zap } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

const StaggeredSendOptimization = () => {
  const [campaignId, setCampaignId] = useState('');
  const [segments, setSegments] = useState('');
  const [optimization, setOptimization] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const optimizeWaves = async () => {
    if (!campaignId || !segments) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/staggered-send/optimize', {
        campaignId,
        recipientSegments: segments.split(',')
      });
      setOptimization(data);
      toast.success('Send waves optimized');
    } catch (error) {
      toast.error('Failed to optimize waves');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Send className="h-8 w-8 text-blue-600" />
            Staggered Send Optimization
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            AI schedules emails in adaptive waves for maximum deliverability
          </p>
        </motion.div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Optimize Send Waves</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Campaign ID</label>
                <input
                  type="text"
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Enter campaign ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Recipient Segments (comma-separated)</label>
                <input
                  type="text"
                  value={segments}
                  onChange={(e) => setSegments(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="high-engagement, low-engagement, new-subscribers"
                />
              </div>
              <button
                onClick={optimizeWaves}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? 'Optimizing...' : 'Optimize Waves'}
                <Zap className="h-4 w-4" />
              </button>
            </div>
          </div>

          {optimization && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Optimized Send Strategy</h2>
              <div className="space-y-4">
                {optimization.waves?.map((wave: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="font-semibold">Wave {index + 1}: {wave.segment}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Send at: {wave.time}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Delay: {wave.delay} minutes</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaggeredSendOptimization;
