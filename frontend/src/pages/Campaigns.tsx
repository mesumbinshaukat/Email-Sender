import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Zap, TrendingUp, Users, Clock, BarChart3, Settings } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

interface Campaign {
  _id: string;
  name: string;
  description: string;
  status: string;
  emails: any[];
  aiOptimization: {
    enabled: boolean;
    autoAdjustSendTime: boolean;
    autoOptimizeSubject: boolean;
    autoFollowUp: boolean;
  };
  performance: {
    totalSent: number;
    totalOpens: number;
    totalClicks: number;
    openRate: number;
    clickRate: number;
  };
  createdAt: string;
}

export const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    aiOptimization: {
      enabled: true,
      autoAdjustSendTime: true,
      autoOptimizeSubject: true,
      autoFollowUp: true,
    },
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get('/agentic/campaigns');
      if (response.data.success) {
        setCampaigns(response.data.data);
      }
    } catch (error: any) {
      toast.error('Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCampaign.name.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    try {
      const response = await axios.post('/agentic/campaigns', newCampaign);
      
      if (response.data.success) {
        toast.success('Campaign created successfully!');
        setShowCreateModal(false);
        setNewCampaign({
          name: '',
          description: '',
          aiOptimization: {
            enabled: true,
            autoAdjustSendTime: true,
            autoOptimizeSubject: true,
            autoFollowUp: true,
          },
        });
        fetchCampaigns();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create campaign');
    }
  };

  const handleOptimizeCampaign = async (campaignId: string) => {
    setOptimizing(campaignId);
    
    try {
      const response = await axios.post(`/agentic/campaigns/${campaignId}/optimize`);
      
      if (response.data.success) {
        toast.success('Campaign optimized successfully!');
        fetchCampaigns();
      }
    } catch (error: any) {
      toast.error('Failed to optimize campaign');
    } finally {
      setOptimizing(null);
    }
  };

  const handleOpenSettings = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowSettingsModal(true);
  };

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCampaign) return;

    try {
      const response = await axios.put(`/agentic/campaigns/${selectedCampaign._id}`, {
        name: selectedCampaign.name,
        description: selectedCampaign.description,
        status: selectedCampaign.status,
        aiOptimization: selectedCampaign.aiOptimization,
      });
      
      if (response.data.success) {
        toast.success('Campaign updated successfully!');
        setShowSettingsModal(false);
        setSelectedCampaign(null);
        fetchCampaigns();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update campaign');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI-Powered Campaigns</h1>
            <p className="text-gray-600 mt-2">Autonomous campaign management with AI optimization</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-5 w-5 mr-2" />
            Create Campaign
          </Button>
        </div>

        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-600 mb-6">Create your first AI-powered campaign to get started</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {campaigns.map((campaign) => (
              <motion.div
                key={campaign._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center space-x-2">
                          <span>{campaign.name}</span>
                          {campaign.aiOptimization.enabled && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full flex items-center">
                              <Zap className="h-3 w-3 mr-1" />
                              AI Enabled
                            </span>
                          )}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{campaign.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                        campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                        campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{campaign.performance.totalSent}</div>
                        <div className="text-sm text-gray-600">Sent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-600">{campaign.performance.openRate}%</div>
                        <div className="text-sm text-gray-600">Open Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{campaign.performance.clickRate}%</div>
                        <div className="text-sm text-gray-600">Click Rate</div>
                      </div>
                    </div>

                    {campaign.aiOptimization.enabled && (
                      <div className="bg-purple-50 rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-semibold text-purple-900 mb-2 flex items-center">
                          <Zap className="h-4 w-4 mr-1" />
                          AI Optimizations Active
                        </h4>
                        <div className="space-y-1 text-xs text-purple-800">
                          {campaign.aiOptimization.autoAdjustSendTime && (
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-2" />
                              Auto-adjust send times
                            </div>
                          )}
                          {campaign.aiOptimization.autoOptimizeSubject && (
                            <div className="flex items-center">
                              <TrendingUp className="h-3 w-3 mr-2" />
                              Subject line optimization
                            </div>
                          )}
                          {campaign.aiOptimization.autoFollowUp && (
                            <div className="flex items-center">
                              <Users className="h-3 w-3 mr-2" />
                              Intelligent follow-ups
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOptimizeCampaign(campaign._id)}
                        isLoading={optimizing === campaign._id}
                        className="flex-1"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Optimize Now
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenSettings(campaign)}>
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Campaign Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create AI-Powered Campaign"
          size="lg"
        >
          <form onSubmit={handleCreateCampaign} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Product Launch Campaign"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={newCampaign.description}
                onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Brief description of your campaign goals"
              />
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                AI Optimization Settings
              </h4>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCampaign.aiOptimization.enabled}
                    onChange={(e) => setNewCampaign({
                      ...newCampaign,
                      aiOptimization: { ...newCampaign.aiOptimization, enabled: e.target.checked }
                    })}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Enable AI optimization</span>
                </label>

                {newCampaign.aiOptimization.enabled && (
                  <>
                    <label className="flex items-center space-x-3 cursor-pointer ml-7">
                      <input
                        type="checkbox"
                        checked={newCampaign.aiOptimization.autoAdjustSendTime}
                        onChange={(e) => setNewCampaign({
                          ...newCampaign,
                          aiOptimization: { ...newCampaign.aiOptimization, autoAdjustSendTime: e.target.checked }
                        })}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Auto-adjust send times</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer ml-7">
                      <input
                        type="checkbox"
                        checked={newCampaign.aiOptimization.autoOptimizeSubject}
                        onChange={(e) => setNewCampaign({
                          ...newCampaign,
                          aiOptimization: { ...newCampaign.aiOptimization, autoOptimizeSubject: e.target.checked }
                        })}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Optimize subject lines</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer ml-7">
                      <input
                        type="checkbox"
                        checked={newCampaign.aiOptimization.autoFollowUp}
                        onChange={(e) => setNewCampaign({
                          ...newCampaign,
                          aiOptimization: { ...newCampaign.aiOptimization, autoFollowUp: e.target.checked }
                        })}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Intelligent follow-ups</span>
                    </label>
                  </>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <Button type="submit" className="flex-1">
                Create Campaign
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        {/* Settings Modal */}
        <Modal
          isOpen={showSettingsModal}
          onClose={() => {
            setShowSettingsModal(false);
            setSelectedCampaign(null);
          }}
          title="Campaign Settings"
          size="lg"
        >
          {selectedCampaign && (
            <form onSubmit={handleUpdateCampaign} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={selectedCampaign.name}
                  onChange={(e) => setSelectedCampaign({ ...selectedCampaign, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={selectedCampaign.description}
                  onChange={(e) => setSelectedCampaign({ ...selectedCampaign, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedCampaign.status}
                  onChange={(e) => setSelectedCampaign({ ...selectedCampaign, status: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  AI Optimization Settings
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCampaign.aiOptimization.enabled}
                      onChange={(e) => setSelectedCampaign({
                        ...selectedCampaign,
                        aiOptimization: { ...selectedCampaign.aiOptimization, enabled: e.target.checked }
                      })}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Enable AI optimization</span>
                  </label>

                  {selectedCampaign.aiOptimization.enabled && (
                    <>
                      <label className="flex items-center space-x-3 cursor-pointer ml-7">
                        <input
                          type="checkbox"
                          checked={selectedCampaign.aiOptimization.autoAdjustSendTime}
                          onChange={(e) => setSelectedCampaign({
                            ...selectedCampaign,
                            aiOptimization: { ...selectedCampaign.aiOptimization, autoAdjustSendTime: e.target.checked }
                          })}
                          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Auto-adjust send times</span>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer ml-7">
                        <input
                          type="checkbox"
                          checked={selectedCampaign.aiOptimization.autoOptimizeSubject}
                          onChange={(e) => setSelectedCampaign({
                            ...selectedCampaign,
                            aiOptimization: { ...selectedCampaign.aiOptimization, autoOptimizeSubject: e.target.checked }
                          })}
                          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Optimize subject lines</span>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer ml-7">
                        <input
                          type="checkbox"
                          checked={selectedCampaign.aiOptimization.autoFollowUp}
                          onChange={(e) => setSelectedCampaign({
                            ...selectedCampaign,
                            aiOptimization: { ...selectedCampaign.aiOptimization, autoFollowUp: e.target.checked }
                          })}
                          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Intelligent follow-ups</span>
                      </label>
                    </>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <Button type="submit" className="flex-1">
                  Update Campaign
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowSettingsModal(false);
                    setSelectedCampaign(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </motion.div>
    </DashboardLayout>
  );
};
