import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from '../lib/axios';
import { motion } from 'framer-motion';
import { FlaskConical, Plus, Play, Trophy, BarChart3 } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ABTest {
  _id: string;
  name: string;
  testType: string;
  status: string;
  variants: any[];
  winner?: any;
  createdAt: string;
}

const ABTesting = () => {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    testType: 'subject_line',
    variants: [
      { name: 'Control', content: '' },
      { name: 'Variant A', content: '' }
    ]
  });

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const { data } = await axios.get('/api/ab-test');
      const payload = (data?.data ?? data) as any;
      setTests(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setTests([]);
      toast.error('Failed to fetch A/B tests');
    }
  };

  const createTest = async () => {
    if (!formData.name || formData.variants.length < 2) {
      toast.error('Please provide test name and at least 2 variants');
      return;
    }

    try {
      const { data } = await axios.post('/api/ab-test/create', formData);
      const created = (data?.data ?? data) as any;
      setTests([created, ...tests]);
      setFormData({
        name: '',
        testType: 'subject_line',
        variants: [
          { name: 'Control', content: '' },
          { name: 'Variant A', content: '' }
        ]
      });
      setShowCreateForm(false);
      toast.success('A/B test created successfully!');
    } catch (error) {
      toast.error('Failed to create test');
    }
  };

  const startTest = async (testId: string) => {
    try {
      await axios.post(`/api/ab-test/${testId}/start`);
      toast.success('Test started successfully!');
      fetchTests();
    } catch (error) {
      toast.error('Failed to start test');
    }
  };

  const analyzeTest = async (testId: string) => {
    try {
      const { data } = await axios.get(`/api/ab-test/${testId}/analysis`);
      const abTest = (data?.abTest ?? data?.data?.abTest ?? null) as any;
      const analysisPayload = (data?.analysis ?? data?.data?.analysis ?? null) as any;
      setSelectedTest(abTest);
      setAnalysis(analysisPayload);
    } catch (error) {
      toast.error('Failed to analyze test');
    }
  };

  const declareWinner = async (testId: string, variantIndex: number) => {
    try {
      await axios.post(`/api/ab-test/${testId}/declare-winner`, { variantIndex });
      toast.success('Winner declared!');
      fetchTests();
      setSelectedTest(null);
      setAnalysis(null);
    } catch (error) {
      toast.error('Failed to declare winner');
    }
  };

  const addVariant = () => {
    const variantNames = ['Control', 'Variant A', 'Variant B', 'Variant C', 'Variant D'];
    const newVariantName = variantNames[formData.variants.length] || `Variant ${String.fromCharCode(65 + formData.variants.length - 1)}`;

    setFormData({
      ...formData,
      variants: [...formData.variants, { name: newVariantName, content: '' }]
    });
  };

  const updateVariant = (index: number, field: string, value: string) => {
    const updated = [...formData.variants];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, variants: updated });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-black flex items-center gap-3">
            <FlaskConical className="h-8 w-8 text-blue-600" />
            A/B Testing
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Test and optimize your email content with statistical analysis
          </p>
        </motion.div>

        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create A/B Test
          </button>
        </div>

        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white rounded-lg shadow p-6 mb-6"
          >
            <h2 className="text-xl font-semibold mb-4">Create A/B Test</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Test Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="E.g., Subject Line Test #1"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Test Type</label>
                <select
                  value={formData.testType}
                  onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="subject_line">Subject Line</option>
                  <option value="content">Email Content</option>
                  <option value="sender">Sender Name</option>
                  <option value="send_time">Send Time</option>
                  <option value="design">Email Design</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Test Variants</label>
              {formData.variants.map((variant, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={variant.name}
                    onChange={(e) => updateVariant(index, 'name', e.target.value)}
                    placeholder="Variant name"
                    className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    value={variant.content}
                    onChange={(e) => updateVariant(index, 'content', e.target.value)}
                    placeholder={`Variant ${variant.name} content`}
                    className="flex-1 h-20 p-2 border rounded focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              ))}
              <button
                onClick={addVariant}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                + Add Variant
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={createTest}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Create Test
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
          {/* Tests List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-semibold">Your A/B Tests</h2>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {tests.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No A/B tests yet. Create your first test to start optimizing!
                  </div>
                ) : (
                  tests.map(test => (
                    <div key={test._id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{test.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {test.testType.replace('_', ' ')} • {test.variants.length} variants
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(test.status)}`}>
                          {test.status}
                        </span>
                      </div>

                      <div className="flex gap-2 mt-3">
                        {test.status === 'draft' && (
                          <button
                            onClick={() => startTest(test._id)}
                            className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1"
                          >
                            <Play className="h-4 w-4" />
                            Start
                          </button>
                        )}
                        {test.status === 'running' && (
                          <button
                            onClick={() => analyzeTest(test._id)}
                            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                          >
                            <BarChart3 className="h-4 w-4" />
                            Analyze
                          </button>
                        )}
                        {test.winner && (
                          <span className="text-green-600 text-sm flex items-center gap-1">
                            <Trophy className="h-4 w-4" />
                            Winner: {test.winner.variantIndex === 0 ? 'Control' : `Variant ${String.fromCharCode(65 + test.winner.variantIndex - 1)}`}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* Analysis Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {selectedTest && analysis ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-6">
                  Analysis: {selectedTest.name}
                </h2>

                {analysis?.winner && (
                  <>
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-800 dark:text-green-200">
                          Winner Declared!
                        </span>
                      </div>
                      <p className="text-green-700 dark:text-green-300">
                        {analysis.winner.variantIndex === 0 ? 'Control' :
                         `Variant ${String.fromCharCode(65 + analysis.winner.variantIndex - 1)}`}
                        improved performance by {analysis.winner.improvement}%
                      </p>
                      <button
                        onClick={() => declareWinner(selectedTest._id, analysis.winner.variantIndex)}
                        className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                      >
                        Apply Winner
                      </button>
                    </div>
                    <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Performance Comparison</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={(selectedTest?.variants ?? []).map((variant: any) => ({
                      name: variant.name,
                      opens: variant.opens || 0,
                      clicks: variant.clicks || 0
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="opens" fill="#3b82f6" name="Opens" />
                      <Bar dataKey="clicks" fill="#10b981" name="Clicks" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <div className="space-y-3">
                    {(selectedTest?.variants ?? []).map((variant: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <span className="font-medium">{variant.name}</span>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {variant.sampleSize || 0} sent • {variant.opens || 0} opens • {variant.clicks || 0} clicks
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {variant.sampleSize > 0 ? Math.round(((variant.opens || 0) / variant.sampleSize) * 100) : 0}% open rate
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {variant.sampleSize > 0 ? Math.round(((variant.clicks || 0) / variant.sampleSize) * 100) : 0}% click rate
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Analysis Selected
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Select a running test to view performance analysis and statistical significance.
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

export default ABTesting;
