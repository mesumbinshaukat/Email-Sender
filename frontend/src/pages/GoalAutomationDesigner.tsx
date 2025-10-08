import { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Target, Zap, Play } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

const GoalAutomationDesigner = () => {
  const [goal, setGoal] = useState('');
  const [currentWorkflow, setCurrentWorkflow] = useState('');
  const [designedWorkflow, setDesignedWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const designWorkflow = async () => {
    if (!goal) {
      toast.error('Please enter a goal');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/goal-automation/design', {
        goal,
        currentWorkflow: currentWorkflow || null
      });
      setDesignedWorkflow(data);
      toast.success('Workflow designed successfully');
    } catch (error) {
      toast.error('Failed to design workflow');
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
            <Target className="h-8 w-8 text-blue-600" />
            Goal-Based AI Automation Designer
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Input a high-level goal and let AI design multi-step automation workflows
          </p>
        </motion.div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Define Your Goal</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Business Goal</label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  rows={3}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Increase repeat purchases by 20% in Q4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Current Workflow (Optional)</label>
                <textarea
                  value={currentWorkflow}
                  onChange={(e) => setCurrentWorkflow(e.target.value)}
                  rows={2}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe any existing automation..."
                />
              </div>
              <button
                onClick={designWorkflow}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? 'Designing...' : 'Design Workflow'}
                <Zap className="h-4 w-4" />
              </button>
            </div>
          </div>

          {designedWorkflow && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">AI-Designed Workflow</h2>
                <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-1">
                  <Play className="h-4 w-4" />
                  Implement
                </button>
              </div>
              <div className="space-y-4">
                {designedWorkflow.steps?.map((step: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="font-semibold">Step {index + 1}: {step.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{step.description}</p>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span><strong>Trigger:</strong> {step.trigger}</span>
                      <span><strong>Delay:</strong> {step.delay || 'None'}</span>
                      <span><strong>Channel:</strong> {step.channel}</span>
                    </div>
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

export default GoalAutomationDesigner;
