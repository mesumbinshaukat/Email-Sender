import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, Calendar, Target, BarChart3, Zap } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Optimization {
  _id: string;
  campaign?: string;
  segment?: string;
  status: string;
  optimizedSchedule: any[];
  performanceMetrics: any;
  aiModel: any;
  createdAt: string;
}

const SendTimeOptimization = () => {
  const [optimizations, setOptimizations] = useState<Optimization[]>([]);
  const [selectedOptimization, setSelectedOptimization] = useState<Optimization | null>(null);
  const [insights, setInsights] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    campaignId: '',
    segmentId: ''
  });

  useEffect(() => {
    fetchOptimizations();
  }, []);

  const fetchOptimizations = async () => {
    try {
      const { data } = await axios.get('/api/send-time-optimization');
      setOptimizations(data);
    } catch (error) {
      toast.error('Failed to fetch optimizations');
    }
  };

  const startOptimization = async () => {
    if (!formData.campaignId) {
      toast.error('Please select a campaign');
      return;
    }

    try {
      const { data } = await axios.post('/api/send-time-optimization/start', formData);
      setOptimizations([data, ...optimizations]);
      setFormData({ campaignId: '', segmentId: '' });
      setShowCreateForm(false);
      toast.success('Optimization started! This may take a few minutes.');
    } catch (error) {
      toast.error('Failed to start optimization');
    }
  };

  const getOptimizationDetails = async (optimizationId: string) => {
    try {
      const { data } = await axios.get(`/api/send-time-optimization/${optimizationId}`);
      setSelectedOptimization(data);
    } catch (error) {
      toast.error('Failed to fetch optimization details');
    }
  };

  const getInsights = async (optimizationId: string) => {
    try {
      const { data } = await axios.get(`/api/send-time-optimization/${optimizationId}/insights`);
      setInsights(data);
    } catch (error) {
      toast.error('Failed to fetch insights');
    }
  };

  const applyOptimization = async (optimizationId: string) => {
    try {
      await axios.post(`/api/send-time-optimization/${optimizationId}/apply`);
      toast.success('Optimized schedule applied to campaign!');
      fetchOptimizations();
    } catch (error) {
      toast.error('Failed to apply optimization');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'optimizing': return 'bg-blue-100 text-blue-800';
      case 'analyzing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <DashboardLayout>
      <div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-600" />
            Send Time Optimization
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            AI-powered analysis to find the optimal times to send your emails for maximum engagement
          </p>
        </motion.div>

        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Start Optimization
          </button>
        </div>

        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white rounded-lg shadow p-6 mb-6"
          >
            <h2 className="text-xl font-semibold mb-4">Start Send Time Optimization</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Campaign ID</label>
                <input
                  type="text"
                  value={formData.campaignId}
                  onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                  placeholder="Enter campaign ID"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Contact Segment ID (Optional)</label>
                <input
                  type="text"
                  value={formData.segmentId}
                  onChange={(e) => setFormData({ ...formData, segmentId: e.target.value })}
                  placeholder="Enter segment ID for targeted analysis"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>How it works:</strong> Our AI analyzes your historical email data to identify patterns in open rates, click rates, and engagement based on send times. This typically takes 2-5 minutes depending on your data volume.
              </p>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={startOptimization}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Start Analysis
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
          {/* Optimizations List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-semibold">Your Optimizations</h2>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {optimizations.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No optimizations yet. Start your first analysis to find optimal send times!
                  </div>
                ) : (
                  optimizations.map(optimization => (
                    <div key={optimization._id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">
                            {optimization.campaign ? `Campaign ${optimization.campaign.slice(-8)}` : 'General Analysis'}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(optimization.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(optimization.status)}`}>
                          {optimization.status}
                        </span>
                      </div>

                      {optimization.performanceMetrics && (
                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Avg Open Rate:</span>
                            <span className="ml-2 font-semibold">{optimization.performanceMetrics.averageOpenRate}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Improvement:</span>
                            <span className="ml-2 font-semibold text-green-600">
                              +{optimization.performanceMetrics.improvement}%
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => getOptimizationDetails(optimization._id)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => getInsights(optimization._id)}
                          className="text-green-600 hover:text-green-700 text-sm"
                        >
                          Insights
                        </button>
                        {optimization.status === 'ready' && (
                          <button
                            onClick={() => applyOptimization(optimization._id)}
                            className="text-purple-600 hover:text-purple-700 text-sm"
                          >
                            Apply Schedule
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* Details/Insights Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {selectedOptimization ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-6">Optimization Details</h2>

                {selectedOptimization.status === 'ready' && selectedOptimization.optimizedSchedule && (
                  <>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Recommended Send Times
                      </h3>
                      <div className="space-y-3">
                        {selectedOptimization.optimizedSchedule.slice(0, 5).map((schedule: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 border rounded">
                            <div>
                              <span className="font-medium">
                                {dayNames[schedule.dayOfWeek]} at {schedule.hour}:00
                              </span>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                Expected: {schedule.expectedOpenRate}% open rate
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-green-600">
                                {schedule.confidence}% confidence
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {selectedOptimization.performanceMetrics?.averageOpenRate}%
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Current Open Rate</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            +{selectedOptimization.performanceMetrics?.improvement}%
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Potential Improvement</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {selectedOptimization.aiModel && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">AI Analysis Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Algorithm:</span>
                        <span className="font-medium capitalize">
                          {selectedOptimization.aiModel.algorithm.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Accuracy:</span>
                        <span className="font-medium">{selectedOptimization.aiModel.accuracy * 100}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Features Analyzed:</span>
                        <span className="font-medium">{selectedOptimization.aiModel.features?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trained:</span>
                        <span className="font-medium">
                          {new Date(selectedOptimization.aiModel.trainedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : insights ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Insights
                </h2>

                <div className="space-y-6">
                  {/* Best Days Chart */}
                  {insights.bestPerformingDays && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Best Performing Days</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={insights.bestPerformingDays}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" tickFormatter={(value) => dayNames[value].slice(0, 3)} />
                          <YAxis />
                          <Tooltip labelFormatter={(value) => dayNames[value]} />
                          <Bar dataKey="openRate" fill="#3b82f6" name="Open Rate %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Best Hours Chart */}
                  {insights.bestPerformingHours && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Best Performing Hours</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={insights.bestPerformingHours.slice(0, 12)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="openRate" stroke="#10b981" name="Open Rate %" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
                    <div className="space-y-3">
                      {insights.recommendations?.map((rec: any, index: number) => (
                        <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900 rounded">
                          <p className="font-medium text-blue-800 dark:text-blue-200">{rec.message}</p>
                          <p className="text-sm text-blue-600 dark:text-blue-400">{rec.action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-12">
                  <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select an optimization to view details
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose an optimization from the list to see recommended send times, performance insights, and application options.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
    </div>
      </DashboardLayout>
  );
};

export default SendTimeOptimization;
