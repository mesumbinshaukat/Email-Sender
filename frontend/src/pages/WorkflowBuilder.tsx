import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from '../lib/axios';
import { motion } from 'framer-motion';
import { GitBranch, Play, Settings } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

interface Workflow {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  nodes: any[];
  edges: any[];
}

const WorkflowBuilder = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const { data } = await axios.get('/api/workflows');
      const payload = (data?.data ?? data) as any;
      setWorkflows(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setWorkflows([]);
      toast.error('Failed to fetch workflows');
    }
  };

  const createWorkflow = async () => {
    if (!name.trim()) {
      toast.error('Please enter workflow name');
      return;
    }

    setCreating(true);
    try {
      const { data } = await axios.post('/api/workflows/create', {
        name,
        description,
        nodes: [],
        edges: []
      });
      const created = (data?.data ?? data) as any;
      setWorkflows([created, ...workflows]);
      toast.success('Workflow created successfully!');
      setName('');
      setDescription('');
    } catch (error) {
      toast.error('Failed to create workflow');
    } finally {
      setCreating(false);
    }
  };

  const executeWorkflow = async (workflowId: string) => {
    try {
      await axios.post(`/api/workflows/${workflowId}/execute`);
      toast.success('Workflow executed!');
    } catch (error) {
      toast.error('Failed to execute workflow');
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
            <GitBranch className="h-8 w-8 text-blue-600" />
            Workflow Automation Builder
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Build automated workflows with drag-and-drop visual designer
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Workflow Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Create Workflow
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Workflow Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Email Workflow"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your workflow"
                    className="w-full h-24 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={createWorkflow}
                  disabled={creating}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <GitBranch className="h-5 w-5" />
                  )}
                  Create Workflow
                </button>
              </div>
            </div>
          </motion.div>

          {/* Workflows List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Your Workflows
              </h2>

              {workflows.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No workflows yet. Create your first one!
                </p>
              ) : (
                <div className="space-y-4">
                  {workflows.map(workflow => (
                    <div
                      key={workflow._id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{workflow.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {workflow.description}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${
                          workflow.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            : 'bg-gray-100 text-gray-800 dark:text-gray-100'
                        }`}>
                          {workflow.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => executeWorkflow(workflow._id)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          <Play className="h-4 w-4" />
                          Execute
                        </button>
                        <button
                          onClick={() => toast.success('Edit coming soon!')}
                          className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm"
                        >
                          <Settings className="h-4 w-4" />
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
    </div>
      </DashboardLayout>
  );
};

export default WorkflowBuilder;
