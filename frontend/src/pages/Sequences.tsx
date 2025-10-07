import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Play, Pause, Edit, Trash2, BarChart3, Mail, Users, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

interface Sequence {
  _id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  totalContacts: number;
  completedContacts: number;
  steps: any[];
  analytics: {
    totalSent: number;
    totalOpens: number;
    totalClicks: number;
    openRate: number;
    clickRate: number;
  };
  createdAt: string;
}

export const Sequences: React.FC = () => {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSequence, setNewSequence] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchSequences();
  }, []);

  const fetchSequences = async () => {
    try {
      const response = await axios.get('/sequences');
      setSequences(response.data.data);
    } catch (error) {
      console.error('Error fetching sequences:', error);
      toast.error('Failed to load sequences');
    } finally {
      setLoading(false);
    }
  };

  const createSequence = async () => {
    if (!newSequence.name.trim()) {
      toast.error('Sequence name is required');
      return;
    }

    try {
      await axios.post('/sequences', {
        name: newSequence.name,
        description: newSequence.description,
        settings: {
          maxSteps: 10,
          respectTimezone: true,
          skipWeekends: false,
          stopOnReply: true,
          stopOnUnsubscribe: true,
          aiOptimization: false
        }
      });

      toast.success('Sequence created successfully!');
      setShowCreateModal(false);
      setNewSequence({ name: '', description: '' });
      await fetchSequences();
    } catch (error) {
      console.error('Error creating sequence:', error);
      toast.error('Failed to create sequence');
    }
  };

  const updateSequenceStatus = async (sequenceId: string, status: string) => {
    try {
      await axios.put(`/sequences/${sequenceId}`, { status });
      toast.success(`Sequence ${status} successfully!`);
      await fetchSequences();
    } catch (error) {
      console.error('Error updating sequence:', error);
      toast.error('Failed to update sequence');
    }
  };

  const deleteSequence = async (sequenceId: string) => {
    if (!confirm('Are you sure you want to delete this sequence?')) return;

    try {
      await axios.delete(`/sequences/${sequenceId}`);
      toast.success('Sequence deleted successfully!');
      await fetchSequences();
    } catch (error) {
      console.error('Error deleting sequence:', error);
      toast.error('Failed to delete sequence');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Email Sequences
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Create automated drip campaigns with conditional logic
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Sequence
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sequences</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sequences.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sequences</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sequences.filter(s => s.status === 'active').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sequences.reduce((sum, s) => sum + s.totalContacts, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Open Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sequences.length > 0 ?
                  Math.round(sequences.reduce((sum, s) => sum + s.analytics.openRate, 0) / sequences.length)
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sequences List */}
        <div className="space-y-4">
          {sequences.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No sequences yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-center">
                  Create your first automated email sequence to nurture leads and improve engagement.
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Sequence
                </Button>
              </CardContent>
            </Card>
          ) : (
            sequences.map((sequence) => (
              <Card key={sequence._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div>
                        <CardTitle className="text-xl">{sequence.name}</CardTitle>
                        {sequence.description && (
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {sequence.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(sequence.status)}>
                        {sequence.status}
                      </Badge>
                      <div className="flex space-x-1">
                        {sequence.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateSequenceStatus(sequence._id, 'active')}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {sequence.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateSequenceStatus(sequence._id, 'paused')}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteSequence(sequence._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{sequence.steps.length}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Steps</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{sequence.totalContacts}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Contacts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{sequence.analytics.totalSent}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Sent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{sequence.analytics.openRate}%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Open Rate</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Created {new Date(sequence.createdAt).toLocaleDateString()}</span>
                    <Button size="sm" variant="outline">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Create Sequence Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create New Sequence</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Sequence Name</label>
                  <input
                    type="text"
                    value={newSequence.name}
                    onChange={(e) => setNewSequence(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Welcome Series, Nurture Campaign"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                  <textarea
                    value={newSequence.description}
                    onChange={(e) => setNewSequence(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe the purpose of this sequence..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewSequence({ name: '', description: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={createSequence}>
                  Create Sequence
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};
