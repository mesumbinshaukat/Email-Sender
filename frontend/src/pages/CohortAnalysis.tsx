import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Cohort {
  _id: string;
  name: string;
  signupDate: string;
  segmentType: string;
  members: any[];
  retentionRates: any[];
}

const CohortAnalysis = () => {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [newCohort, setNewCohort] = useState({
    name: '',
    signupDate: '',
    segmentType: 'monthly'
  });

  useEffect(() => {
    fetchCohorts();
  }, []);

  const fetchCohorts = async () => {
    try {
      const { data } = await axios.get('/api/cohort');
      setCohorts(data);
    } catch (error) {
      toast.error('Failed to fetch cohorts');
    }
  };

  const createCohort = async () => {
    if (!newCohort.name || !newCohort.signupDate) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const { data } = await axios.post('/api/cohort/create', newCohort);
      setCohorts([data, ...cohorts]);
      setNewCohort({ name: '', signupDate: '', segmentType: 'monthly' });
      toast.success('Cohort created successfully!');
    } catch (error) {
      toast.error('Failed to create cohort');
    }
  };

  const analyzeCohort = async (cohortId: string) => {
    try {
      const { data } = await axios.get(`/api/cohort/${cohortId}/analysis`);
      setSelectedCohort(data.cohort);
      setAnalysis(data);
    } catch (error) {
      toast.error('Failed to analyze cohort');
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
            <Users className="h-8 w-8 text-blue-600" />
            Cohort Analysis
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Analyze user behavior and retention patterns by signup groups
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Cohort Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Create Cohort
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Cohort Name</label>
                  <input
                    type="text"
                    value={newCohort.name}
                    onChange={(e) => setNewCohort({ ...newCohort, name: e.target.value })}
                    placeholder="E.g., October 2024 Signups"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Signup Date</label>
                  <input
                    type="date"
                    value={newCohort.signupDate}
                    onChange={(e) => setNewCohort({ ...newCohort, signupDate: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Segment Type</label>
                  <select
                    value={newCohort.segmentType}
                    onChange={(e) => setNewCohort({ ...newCohort, segmentType: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <button
                  onClick={createCohort}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700"
                >
                  Create Cohort
                </button>
              </div>
            </div>
          </motion.div>

          {/* Cohorts List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Your Cohorts
              </h2>

              {cohorts.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No cohorts yet. Create your first cohort to start analyzing retention.
                </p>
              ) : (
                <div className="space-y-4">
                  {cohorts.map(cohort => (
                    <div
                      key={cohort._id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{cohort.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {cohort.segmentType} • {cohort.members?.length || 0} members
                          </p>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(cohort.signupDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => analyzeCohort(cohort._id)}
                          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                        >
                          <TrendingUp className="h-4 w-4" />
                          Analyze
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Analysis Results */}
        {analysis && selectedCohort && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">
                Cohort Analysis: {selectedCohort.name}
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {analysis.summary.totalMembers}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Members</div>
                </div>

                <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analysis.summary.avgRetentionRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Retention Rate</div>
                </div>

                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {analysis.summary.bestPeriod.period} days
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Best Retention Period
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Retention Curve</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analysis.retentionRates}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" label={{ value: 'Days Since Signup', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Retention Rate (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="retentionRate" stroke="#3b82f6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Detailed Retention Rates</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Period (Days)</th>
                        <th className="px-4 py-2 text-left">Retained</th>
                        <th className="px-4 py-2 text-left">Churned</th>
                        <th className="px-4 py-2 text-left">Retention Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.retentionRates.map((rate: any, index: number) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{rate.period}</td>
                          <td className="px-4 py-2">{rate.retained}</td>
                          <td className="px-4 py-2">{rate.churned}</td>
                          <td className="px-4 py-2 font-semibold">{rate.retentionRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CohortAnalysis;
