import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Target, BarChart3, Eye, Plus, Settings, Trash2, AlertTriangle, Lightbulb } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

interface Competitor {
  _id: string;
  name: string;
  domain: string;
  industry: string;
  description?: string;
  website?: string;
  contentStrategy?: {
    frequency: string;
    topics: string[];
    tone: string;
  };
  performanceMetrics?: {
    openRate?: number;
    clickRate?: number;
    unsubscribeRate?: number;
    lastAnalyzed?: string;
  };
  insights: Array<{
    type: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    actionable: boolean;
  }>;
  monitoringSettings: {
    active: boolean;
    frequency: string;
  };
}

interface BenchmarkData {
  industry: string;
  metrics: {
    averageOpenRate: number;
    averageClickRate: number;
    averageUnsubscribeRate: number;
    topSubjectKeywords: string[];
    optimalSendDays: string[];
    optimalSendTimes: string[];
    contentLength: {
      average: number;
      recommended: number;
    };
    imageUsageRate: number;
    personalizationRate: number;
    mobileOptimizationRate: number;
  };
}

interface TrendData {
  subjectLineTrends: Record<string, number>;
  contentStrategyTrends: Record<string, any>;
  timingPatterns: Record<string, any>;
  engagementTactics: Record<string, any>;
  overallInsights: any[];
}

export const CompetitorAnalysis: React.FC = () => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkData | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const [activeTab, setActiveTab] = useState<'competitors' | 'benchmarks' | 'trends'>('competitors');
  const [newCompetitor, setNewCompetitor] = useState({
    name: '',
    domain: '',
    industry: '',
    description: '',
    website: '',
  });

  useEffect(() => {
    fetchCompetitors();
    fetchBenchmarks();
    fetchTrends();
  }, []);

  const fetchCompetitors = async () => {
    try {
      const response = await axios.get('/competitors');
      setCompetitors(response.data.data);
    } catch (error) {
      console.error('Error fetching competitors:', error);
      toast.error('Failed to load competitors');
    } finally {
      setLoading(false);
    }
  };

  const fetchBenchmarks = async () => {
    try {
      const response = await axios.get('/competitors/benchmarks');
      setBenchmarks(response.data.data[0] || null);
    } catch (error) {
      console.error('Error fetching benchmarks:', error);
    }
  };

  const fetchTrends = async () => {
    try {
      const response = await axios.get('/competitors/trends');
      setTrends(response.data.data);
    } catch (error) {
      console.error('Error fetching trends:', error);
    }
  };

  const addCompetitor = async () => {
    if (!newCompetitor.name || !newCompetitor.domain || !newCompetitor.industry) {
      toast.error('Name, domain, and industry are required');
      return;
    }

    try {
      await axios.post('/competitors/add', newCompetitor);
      toast.success('Competitor added successfully!');
      setShowAddModal(false);
      setNewCompetitor({ name: '', domain: '', industry: '', description: '', website: '' });
      await fetchCompetitors();
    } catch (error: any) {
      console.error('Error adding competitor:', error);
      toast.error(error.response?.data?.message || 'Failed to add competitor');
    }
  };

  const removeCompetitor = async (competitorId: string) => {
    if (!confirm('Are you sure you want to remove this competitor?')) return;

    try {
      await axios.delete(`/competitors/${competitorId}`);
      toast.success('Competitor removed successfully!');
      await fetchCompetitors();
    } catch (error) {
      console.error('Error removing competitor:', error);
      toast.error('Failed to remove competitor');
    }
  };

  const fetchCompetitorInsights = async (competitorId: string) => {
    try {
      const response = await axios.get(`/competitors/${competitorId}/insights`);
      const competitor = response.data.data.competitor;
      setCompetitors(prev => prev.map(c => c._id === competitorId ? competitor : c));
      setSelectedCompetitor(competitor);
    } catch (error) {
      console.error('Error fetching competitor insights:', error);
      toast.error('Failed to load competitor insights');
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'daily': return '🔥';
      case 'weekly': return '📅';
      case 'biweekly': return '📆';
      case 'monthly': return '🗓️';
      default: return '❓';
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
              Competitor Analysis
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Monitor competitors and benchmark against industry standards
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-8 w-8 text-blue-500" />
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Competitor
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Competitors Monitored</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{competitors.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Open Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {competitors.length > 0
                  ? (competitors.reduce((sum, c) => sum + (c.performanceMetrics?.openRate || 0), 0) / competitors.length).toFixed(1)
                  : 0}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Industry Benchmark</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {benchmarks?.metrics.averageOpenRate.toFixed(1) || 0}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actionable Insights</CardTitle>
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {competitors.reduce((sum, c) => sum + c.insights.length, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2">
          {[
            { key: 'competitors', label: 'Competitors', icon: Users },
            { key: 'benchmarks', label: 'Benchmarks', icon: BarChart3 },
            { key: 'trends', label: 'Trends', icon: TrendingUp },
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={activeTab === key ? 'primary' : 'outline'}
              onClick={() => setActiveTab(key as any)}
              className="flex items-center space-x-2"
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Button>
          ))}
        </div>

        {/* Competitors Tab */}
        {activeTab === 'competitors' && (
          <div className="space-y-4">
            {competitors.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No competitors monitored yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                    Add competitors to start monitoring their email strategies and performance.
                  </p>
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Competitor
                  </Button>
                </CardContent>
              </Card>
            ) : (
              competitors.map((competitor) => (
                <Card key={competitor._id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {competitor.name}
                          </h3>
                          <Badge className={competitor.monitoringSettings.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {competitor.monitoringSettings.active ? 'Active' : 'Inactive'}
                          </Badge>
                          <span className="text-sm text-gray-500">{competitor.domain}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Industry</div>
                            <div className="font-medium">{competitor.industry}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Frequency</div>
                            <div className="font-medium flex items-center">
                              <span className="mr-2">{getFrequencyIcon(competitor.contentStrategy?.frequency || 'unknown')}</span>
                              {competitor.contentStrategy?.frequency || 'Unknown'}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Open Rate</div>
                            <div className="font-medium text-green-600">
                              {competitor.performanceMetrics?.openRate?.toFixed(1) || 'N/A'}%
                            </div>
                          </div>
                        </div>

                        {competitor.insights.length > 0 && (
                          <div className="mb-4">
                            <div className="text-sm font-medium mb-2">Key Insights ({competitor.insights.length})</div>
                            <div className="flex flex-wrap gap-2">
                              {competitor.insights.slice(0, 3).map((insight, index) => (
                                <Badge key={index} className={getImpactColor(insight.impact)}>
                                  {insight.title}
                                </Badge>
                              ))}
                              {competitor.insights.length > 3 && (
                                <Badge variant="outline">+{competitor.insights.length - 3} more</Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {competitor.contentStrategy?.topics && (
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Content Topics</div>
                            <div className="flex flex-wrap gap-1">
                              {competitor.contentStrategy.topics.map((topic, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => fetchCompetitorInsights(competitor._id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Insights
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeCompetitor(competitor._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Benchmarks Tab */}
        {activeTab === 'benchmarks' && benchmarks && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Industry Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Average Open Rate</span>
                  <span className="font-medium text-green-600">{benchmarks.metrics.averageOpenRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Average Click Rate</span>
                  <span className="font-medium text-blue-600">{benchmarks.metrics.averageClickRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Average Unsubscribe Rate</span>
                  <span className="font-medium text-red-600">{benchmarks.metrics.averageUnsubscribeRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Image Usage Rate</span>
                  <span className="font-medium text-purple-600">{benchmarks.metrics.imageUsageRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Personalization Rate</span>
                  <span className="font-medium text-orange-600">{benchmarks.metrics.personalizationRate}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Best Practices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">Optimal Send Days</div>
                  <div className="flex flex-wrap gap-1">
                    {benchmarks.metrics.optimalSendDays.map((day, index) => (
                      <Badge key={index} variant="outline" className="capitalize">
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Optimal Send Times</div>
                  <div className="flex flex-wrap gap-1">
                    {benchmarks.metrics.optimalSendTimes.map((time, index) => (
                      <Badge key={index} variant="outline">
                        {time}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Top Subject Keywords</div>
                  <div className="flex flex-wrap gap-1">
                    {benchmarks.metrics.topSubjectKeywords.slice(0, 5).map((keyword, index) => (
                      <Badge key={index} className="bg-blue-100 text-blue-800">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && trends && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subject Line Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(trends.subjectLineTrends)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([keyword, count]) => (
                      <div key={keyword} className="flex items-center justify-between">
                        <span className="font-medium">"{keyword}"</span>
                        <div className="flex items-center space-x-2">
                          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 flex-1 max-w-32">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${(count / Math.max(...Object.values(trends.subjectLineTrends))) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400 w-8">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Competitor Insights Modal */}
        {selectedCompetitor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedCompetitor.name} Insights</h2>
                    <p className="text-gray-600 dark:text-gray-400">{selectedCompetitor.domain}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCompetitor(null)}
                  >
                    Close
                  </Button>
                </div>

                <div className="space-y-6">
                  {selectedCompetitor.insights.map((insight, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                            insight.impact === 'high' ? 'text-red-500' :
                            insight.impact === 'medium' ? 'text-yellow-500' : 'text-green-500'
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium">{insight.title}</h4>
                              <Badge className={getImpactColor(insight.impact)}>
                                {insight.impact} impact
                              </Badge>
                              {insight.actionable && (
                                <Badge className="bg-blue-100 text-blue-800">
                                  Actionable
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">{insight.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Competitor Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Add Competitor</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Company Name</label>
                    <input
                      type="text"
                      value={newCompetitor.name}
                      onChange={(e) => setNewCompetitor(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Company Inc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Domain</label>
                    <input
                      type="text"
                      value={newCompetitor.domain}
                      onChange={(e) => setNewCompetitor(prev => ({ ...prev, domain: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Industry</label>
                    <select
                      value={newCompetitor.industry}
                      onChange={(e) => setNewCompetitor(prev => ({ ...prev, industry: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select industry...</option>
                      <option value="technology">Technology</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="finance">Finance</option>
                      <option value="retail">Retail</option>
                      <option value="education">Education</option>
                      <option value="marketing">Marketing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Website (Optional)</label>
                    <input
                      type="url"
                      value={newCompetitor.website}
                      onChange={(e) => setNewCompetitor(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                    <textarea
                      value={newCompetitor.description}
                      onChange={(e) => setNewCompetitor(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Brief description of the competitor..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddModal(false);
                      setNewCompetitor({ name: '', domain: '', industry: '', description: '', website: '' });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={addCompetitor}>
                    Add Competitor
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};
