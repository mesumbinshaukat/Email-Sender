import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, AlertTriangle, Target, LineChart } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const PredictiveAnalytics = () => {
  const [forecastData, setForecastData] = useState<any>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [anomaliesData, setAnomaliesData] = useState<any>(null);
  const [churnData, setChurnData] = useState<any>(null);
  const [growthData, setGrowthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      const [forecast, trends, anomalies, churn, growth] = await Promise.all([
        axios.get('/api/analytics/forecast'),
        axios.get('/api/analytics/trends'),
        axios.get('/api/analytics/anomalies'),
        axios.get('/api/analytics/churn-prediction'),
        axios.get('/api/analytics/growth-projection')
      ]);

      setForecastData(forecast.data);
      setTrendsData(trends.data);
      setAnomaliesData(anomalies.data);
      setChurnData(churn.data);
      setGrowthData(growth.data);
    } catch (error) {
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            Predictive Analytics Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            AI-powered insights and forecasting for your email campaigns
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Forecast Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              30-Day Performance Forecast
            </h2>

            {forecastData?.forecast && (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={forecastData.forecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="predictedOpens" stroke="#3b82f6" name="Predicted Opens" />
                  <Line type="monotone" dataKey="predictedClicks" stroke="#10b981" name="Predicted Clicks" />
                </RechartsLineChart>
              </ResponsiveContainer>
            )}

            {forecastData?.historical && (
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Current Open Rate:</span>
                  <span className="ml-2 font-semibold">{forecastData.historical.openRate}%</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Current Click Rate:</span>
                  <span className="ml-2 font-semibold">{forecastData.historical.clickRate}%</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Trends Analysis */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Engagement Trends
            </h2>

            {trendsData?.trends && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trendsData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sent" fill="#3b82f6" name="Sent" />
                  <Bar dataKey="opened" fill="#10b981" name="Opened" />
                </BarChart>
              </ResponsiveContainer>
            )}

            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Trend:</span>
              <span className={`px-2 py-1 text-xs rounded ${
                trendsData?.overallTrend === 'upward'
                  ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                  : trendsData?.overallTrend === 'downward'
                  ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
              }`}>
                {trendsData?.overallTrend || 'stable'}
              </span>
            </div>
          </motion.div>

          {/* Churn Prediction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Churn Risk Analysis
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Churn Risk:</span>
                <span className={`px-3 py-1 text-sm rounded ${
                  churnData?.churnRisk === 'high'
                    ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                    : churnData?.churnRisk === 'medium'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                    : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                }`}>
                  {churnData?.churnRisk || 'low'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Recent Engagement:</span>
                  <span className="ml-2 font-semibold">{churnData?.recentEngagement}%</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Previous Engagement:</span>
                  <span className="ml-2 font-semibold">{churnData?.olderEngagement}%</span>
                </div>
              </div>

              {churnData?.recommendations && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Recommendations:</span>
                  <ul className="mt-2 space-y-1">
                    {churnData.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>

          {/* Growth Projection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Growth Projection
            </h2>

            {growthData?.projections && (
              <ResponsiveContainer width="100%" height={250}>
                <RechartsLineChart data={growthData.projections}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="projectedSent" stroke="#3b82f6" name="Projected Sent" />
                  <Line type="monotone" dataKey="projectedOpens" stroke="#10b981" name="Projected Opens" />
                </RechartsLineChart>
              </ResponsiveContainer>
            )}

            {growthData?.current && (
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Avg Weekly Sent:</span>
                  <span className="ml-2 font-semibold">{growthData.current.avgWeeklySent}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Avg Weekly Opens:</span>
                  <span className="ml-2 font-semibold">{growthData.current.avgWeeklyOpens}</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Anomalies Alert */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 lg:col-span-2"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Anomaly Detection
            </h2>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {anomaliesData?.message || 'Monitoring for unusual patterns...'}
                </p>
                {anomaliesData?.anomalies?.length > 0 && (
                  <div className="space-y-2">
                    {anomaliesData.anomalies.slice(0, 3).map((anomaly: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className={`px-2 py-1 text-xs rounded ${
                          anomaly.type === 'spike' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {anomaly.type}
                        </span>
                        <span>{anomaly.day}: {anomaly.sent} emails sent</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {anomaliesData?.anomalies?.length || 0}
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Anomalies</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalytics;
