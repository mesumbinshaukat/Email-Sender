import { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { TrendingUp, Clock } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

const PredictiveCLV = () => {
  const [contactId, setContactId] = useState('');
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const predictCLV = async () => {
    if (!contactId) {
      toast.error('Please enter contact ID');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get(`/api/clv/predict/${contactId}`);
      setPrediction(data);
      toast.success('CLV predicted successfully');
    } catch (error) {
      toast.error('Failed to predict CLV');
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
            <TrendingUp className="h-8 w-8 text-blue-600" />
            Predictive CLV & Next-Order Timing
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            AI forecasts customer lifetime value and exact next-purchase windows
          </p>
        </motion.div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Predict Customer Value</h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                placeholder="Enter contact ID"
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <button
                onClick={predictCLV}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? 'Predicting...' : 'Predict CLV'}
                <TrendingUp className="h-4 w-4" />
              </button>
            </div>
          </div>

          {prediction && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Prediction Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Lifetime Value</h3>
                  <p className="text-2xl font-bold text-green-600">${prediction.clv}</p>
                  <p className="text-sm text-green-600 mt-1">Estimated total value</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Next Purchase
                  </h3>
                  <p className="text-2xl font-bold text-blue-600">{prediction.nextPurchaseDays} days</p>
                  <p className="text-sm text-blue-600 mt-1">Estimated timing</p>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold mb-2">AI Insights:</h4>
                <p className="text-gray-600 dark:text-gray-400">{prediction.insights}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictiveCLV;
