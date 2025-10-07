import { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ImageIcon, RefreshCw } from 'lucide-react';

const VisualPersonalization = () => {
  const [email, setEmail] = useState('');
  const [liveData, setLiveData] = useState<any>(null);
  const [generatedVisual, setGeneratedVisual] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLiveData = async () => {
    if (!email) return;

    try {
      const { data } = await axios.get(`/api/visual-personalization/live-data/${email}`);
      setLiveData(data);
    } catch (error) {
      toast.error('Failed to fetch live data');
    }
  };

  const generateVisual = async () => {
    if (!liveData) return;

    setLoading(true);
    try {
      const { data } = await axios.post('/api/visual-personalization/generate', {
        recipientData: liveData,
        baseImage: 'default-banner.jpg',
        visualType: 'image'
      });
      setGeneratedVisual(data.description);
      toast.success('Personalized visual generated');
    } catch (error) {
      toast.error('Failed to generate visual');
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
            <ImageIcon className="h-8 w-8 text-blue-600" />
            Real-Time Visual Personalization Engine
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Generate hyper-personalized images and videos based on live recipient data
          </p>
        </motion.div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Fetch Live Recipient Data</h2>
            <div className="flex gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter recipient email"
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <button
                onClick={fetchLiveData}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Fetch Data
              </button>
            </div>

            {liveData && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold mb-2">Live Data:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Weather:</strong> {liveData.weather}</div>
                  <div><strong>Location:</strong> {liveData.location}</div>
                  <div><strong>Interests:</strong> {liveData.interests?.join(', ')}</div>
                  <div><strong>Recent Activity:</strong> {liveData.recentActivity}</div>
                </div>
              </div>
            )}
          </div>

          {liveData && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Generated Personalized Visual</h2>
                <button
                  onClick={generateVisual}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate Visual'}
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded p-6 min-h-[200px] flex items-center justify-center">
                {generatedVisual ? (
                  <div className="text-center">
                    <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Personalized Visual Description:
                    </p>
                    <p className="text-gray-800 dark:text-gray-200">
                      {generatedVisual}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    Click "Generate Visual" to create personalized content
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualPersonalization;
