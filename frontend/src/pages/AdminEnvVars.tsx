import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Settings, Plus, Edit, Trash2 } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

interface EnvVar {
  _id: string;
  key: string;
  value: string;
  description: string;
  category: string;
}

const AdminEnvVars = () => {
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVar, setEditingVar] = useState<EnvVar | null>(null);
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    description: '',
    category: 'api_keys'
  });

  useEffect(() => {
    fetchEnvVars();
  }, []);

  const fetchEnvVars = async () => {
    try {
      const { data } = await axios.get('/api/admin/env-vars');
      setEnvVars(data);
    } catch (error) {
      toast.error('Failed to fetch environment variables');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.key || !formData.value) {
      toast.error('Key and value are required');
      return;
    }

    try {
      if (editingVar) {
        await axios.put(`/api/admin/env-vars/${editingVar.key}`, formData);
        toast.success('Environment variable updated');
      } else {
        await axios.post('/api/admin/env-vars', formData);
        toast.success('Environment variable added');
      }
      fetchEnvVars();
      resetForm();
    } catch (error) {
      toast.error('Failed to save environment variable');
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm('Are you sure you want to delete this environment variable?')) return;

    try {
      await axios.delete(`/api/admin/env-vars/${key}`);
      toast.success('Environment variable deleted');
      fetchEnvVars();
    } catch (error) {
      toast.error('Failed to delete environment variable');
    }
  };

  const resetForm = () => {
    setFormData({ key: '', value: '', description: '', category: 'api_keys' });
    setEditingVar(null);
    setShowAddForm(false);
  };

  const startEdit = (envVar: EnvVar) => {
    setFormData({
      key: envVar.key,
      value: envVar.value,
      description: envVar.description,
      category: envVar.category
    });
    setEditingVar(envVar);
    setShowAddForm(true);
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
            <Settings className="h-8 w-8 text-blue-600" />
            Admin - Environment Variables
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage API keys and configuration stored in MongoDB Atlas
          </p>
        </motion.div>

        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {showAddForm ? 'Cancel' : 'Add Variable'}
          </button>
        </div>

        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6"
          >
            <h2 className="text-xl font-semibold mb-4">
              {editingVar ? 'Edit' : 'Add'} Environment Variable
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Key</label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="OPENAI_API_KEY"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  disabled={!!editingVar}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Value</label>
                <input
                  type="password"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="sk-..."
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="OpenAI API Key for AI features"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="api_keys">API Keys</option>
                  <option value="database">Database</option>
                  <option value="smtp">SMTP</option>
                  <option value="integrations">Integrations</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  {editingVar ? 'Update' : 'Add'} Variable
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Environment Variables</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Value (masked)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {envVars.map((envVar) => (
                  <tr key={envVar._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {envVar.key}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {envVar.value ? '••••••••' : 'Not set'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {envVar.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {envVar.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(envVar)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(envVar.key)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEnvVars;
