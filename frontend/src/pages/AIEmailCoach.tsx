import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, Target, CheckCircle, AlertTriangle } from 'lucide-react';

const AIEmailCoach = () => {
  const [insights, setInsights] = useState([]);
  const [performance, setPerformance] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const { data } = await axios.get('/api/gamification/ai-coach');
      setInsights(data.insights || []);
      setPerformance(data.performance);
    } catch (error) {
      toast.error('Failed to fetch AI insights');
    }
  };

  const implementInsight = async (insightId) => {
    try {
      await axios.post('/api/gamification/ai-coach/implement', { insightId });
      toast.success('Insight marked as implemented!');
      fetchInsights();
    } catch (error) {
      toast.error('Failed to update insight');
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
            <Lightbulb className="h-8 w-8 text-blue-600" />
            AI Email Coach
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Get personalized recommendations to improve your email performance
          </p>
        </motion.div>

        {performance && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{performance.currentScore}/100</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Performance Score</div>
              <div className={`text-xs mt-1 ${performance.trend === 'improving' ? 'text-green-600' : performance.trend === 'declining' ? 'text-red-600' : 'text-yellow-600'}`}>
                {performance.trend === 'improving' ? '↗ Improving' : performance.trend === 'declining' ? '↘ Declining' : '→ Stable'}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{insights.filter(i => i.implemented).length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Implemented Insights</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{insights.filter(i => !i.implemented).length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Pending Actions</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">AI Insights & Recommendations</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {insights.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No insights available yet. Keep sending emails to get personalized recommendations!
                </div>
              ) : (
                insights.map(insight => (
                  <div key={insight._id} className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      {insight.impact === 'high' ? (
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      ) : insight.impact === 'medium' ? (
                        <Target className="h-5 w-5 text-yellow-600 mt-0.5" />
                      ) : (
                        <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold capitalize">{insight.type.replace('_', ' ')}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{insight.message}</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">{insight.action}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className={`text-xs px-2 py-1 rounded capitalize ${
                            insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                            insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {insight.impact} impact
                          </span>
                          {insight.implemented ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Implemented
                            </span>
                          ) : (
                            <button
                              onClick={() => implementInsight(insight._id)}
                              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            >
                              Mark as Done
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Performance Goals</h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Open Rate Target</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">25%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Current: 20% | Target: 25%</p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Click Rate Target</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">8%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '6%' }}></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Current: 6% | Target: 8%</p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Monthly Sends</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">1000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Current: 750 | Target: 1000</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">💡 Pro Tip</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Focus on implementing high-impact insights first. Small changes can lead to significant improvements in your email performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIEmailCoach;
