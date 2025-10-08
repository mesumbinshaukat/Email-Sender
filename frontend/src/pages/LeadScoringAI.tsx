import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Users, Star, AlertTriangle, BarChart3, Zap } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

interface LeadScore {
  _id: string;
  overallScore: number;
  leadGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  leadStatus: 'hot' | 'warm' | 'cold' | 'qualified' | 'nurturing' | 'disqualified';
  scoreBreakdown: {
    engagementScore: number;
    demographicScore: number;
    behavioralScore: number;
    intentScore: number;
    firmographicScore: number;
  };
  conversionProbability: number;
  predictedValue: {
    amount: number;
    currency: string;
    confidence: number;
  };
  recommendations: Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    suggestedAction: string;
  }>;
  alerts: Array<{
    type: string;
    message: string;
    triggeredAt: string;
    acknowledged: boolean;
  }>;
  contactId: {
    _id: string;
    name?: { full?: string };
    email: string;
    company?: { name?: string };
  };
}

interface LeadAnalytics {
  scoreDistribution: Array<{
    _id: string;
    count: number;
  }>;
  gradeDistribution: Array<{
    _id: string;
    count: number;
    avgScore: number;
  }>;
  statusDistribution: Array<{
    _id: string;
    count: number;
    avgScore: number;
  }>;
  probabilityInsights: {
    avgProbability: number;
    highProbabilityCount: number;
    totalLeads: number;
  };
  summary: {
    totalScoredLeads: number;
    hotLeadsCount: number;
    averageScore: number;
  };
}

export const LeadScoringAI: React.FC = () => {
  const [leads, setLeads] = useState<LeadScore[]>([]);
  const [analytics, setAnalytics] = useState<LeadAnalytics | null>(null);
  const [hotLeads, setHotLeads] = useState<LeadScore[]>([]);
  const [salesReadyLeads, setSalesReadyLeads] = useState<LeadScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<LeadScore | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'hot' | 'analytics'>('overview');

  useEffect(() => {
    fetchLeadData();
  }, []);

  const fetchLeadData = async () => {
    try {
      setLoading(true);
      const [leadsRes, analyticsRes, hotLeadsRes, salesReadyRes] = await Promise.all([
        axios.get('/leads/hot-leads?limit=50'),
        axios.get('/leads/analytics'),
        axios.get('/leads/hot-leads?limit=10'),
        axios.get('/leads/sales-ready?limit=10'),
      ]);

      setLeads(leadsRes.data.data);
      setAnalytics(analyticsRes.data.data);
      setHotLeads(hotLeadsRes.data.data);
      setSalesReadyLeads(salesReadyRes.data.data);
    } catch (error) {
      console.error('Error fetching lead data:', error);
      toast.error('Failed to load lead data');
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = async (contactId: string) => {
    try {
      await axios.post(`/leads/calculate-score/${contactId}`);
      toast.success('Lead score calculated successfully!');
      await fetchLeadData();
    } catch (error) {
      console.error('Error calculating lead score:', error);
      toast.error('Failed to calculate lead score');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'D': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'F': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot': return 'bg-red-100 text-red-800 border-red-200';
      case 'warm': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'qualified': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cold': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
              Lead Scoring AI
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              AI-powered lead qualification and scoring system
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Target className="h-8 w-8 text-blue-500" />
            <Star className="h-8 w-8 text-yellow-500" />
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        {/* Overview Stats */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Scored Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.summary.totalScoredLeads}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{analytics.summary.hotLeadsCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Score</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(Math.round(analytics.summary.averageScore))}`}>
                  {Math.round(analytics.summary.averageScore)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Probability</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analytics.probabilityInsights.highProbabilityCount}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-2">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'leads', label: 'All Leads', icon: Users },
            { key: 'hot', label: 'Hot Leads', icon: Star },
            { key: 'analytics', label: 'Analytics', icon: TrendingUp },
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Hot Leads Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Top Hot Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {hotLeads.slice(0, 5).map((lead) => (
                    <div key={lead._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                          lead.overallScore >= 80 ? 'bg-green-500' :
                          lead.overallScore >= 60 ? 'bg-blue-500' : 'bg-gray-500'
                        }`}>
                          {lead.overallScore}
                        </div>
                        <div>
                          <div className="font-medium">
                            {lead.contactId?.name?.full || lead.contactId?.email}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {lead.contactId?.company?.name || 'Unknown Company'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getGradeColor(lead.leadGrade)}>
                          {lead.leadGrade}
                        </Badge>
                        <Badge className={getStatusColor(lead.leadStatus)}>
                          {lead.leadStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Score Distribution */}
            {analytics && (
              <Card>
                <CardHeader>
                  <CardTitle>Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {analytics.scoreDistribution.map((bucket) => (
                      <div key={bucket._id} className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{bucket.count}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{bucket._id}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Grade Distribution */}
            {analytics && (
              <Card>
                <CardHeader>
                  <CardTitle>Grade Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    {analytics.gradeDistribution.map((grade) => (
                      <div key={grade._id} className="text-center">
                        <Badge className={`${getGradeColor(grade._id)} text-lg px-3 py-2`}>
                          {grade._id}
                        </Badge>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {grade.count} leads
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div className="space-y-4">
            {leads.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No leads scored yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                    Start scoring your contacts to identify high-value leads and prioritize your sales efforts.
                  </p>
                  <Button>
                    <Zap className="h-4 w-4 mr-2" />
                    Score Your First Lead
                  </Button>
                </CardContent>
              </Card>
            ) : (
              leads.map((lead) => (
                <Card key={lead._id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-xl ${
                          lead.overallScore >= 80 ? 'bg-green-500' :
                          lead.overallScore >= 60 ? 'bg-blue-500' :
                          lead.overallScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}>
                          {lead.overallScore}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {lead.contactId?.name?.full || lead.contactId?.email}
                            </h3>
                            <Badge className={getGradeColor(lead.leadGrade)}>
                              {lead.leadGrade}
                            </Badge>
                            <Badge className={getStatusColor(lead.leadStatus)}>
                              {lead.leadStatus}
                            </Badge>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">
                            {lead.contactId?.email} • {lead.contactId?.company?.name || 'Unknown Company'}
                          </p>

                          {/* Score Breakdown */}
                          <div className="grid grid-cols-5 gap-2 text-xs">
                            <div className="text-center">
                              <div className="font-medium text-green-600">{lead.scoreBreakdown.engagementScore}</div>
                              <div className="text-gray-500">Engage</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-blue-600">{lead.scoreBreakdown.intentScore}</div>
                              <div className="text-gray-500">Intent</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-purple-600">{lead.scoreBreakdown.behavioralScore}</div>
                              <div className="text-gray-500">Behavior</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-orange-600">{lead.scoreBreakdown.demographicScore}</div>
                              <div className="text-gray-500">Demog</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-pink-600">{lead.scoreBreakdown.firmographicScore}</div>
                              <div className="text-gray-500">Firm</div>
                            </div>
                          </div>

                          {/* Conversion Probability */}
                          <div className="mt-3 flex items-center space-x-2">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Conversion Probability:
                            </div>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${lead.conversionProbability * 100}%` }}
                              />
                            </div>
                            <div className="text-sm font-medium text-green-600">
                              {Math.round(lead.conversionProbability * 100)}%
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <Button
                          size="sm"
                          onClick={() => setSelectedLead(lead)}
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => calculateScore(lead.contactId._id)}
                        >
                          Recalculate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Hot Leads Tab */}
        {activeTab === 'hot' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales-Ready Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {salesReadyLeads.map((lead) => (
                    <div key={lead._id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center font-bold text-white">
                          {lead.overallScore}
                        </div>
                        <div>
                          <div className="font-medium">
                            {lead.contactId?.name?.full || lead.contactId?.email}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {lead.contactId?.company?.name || 'Unknown Company'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-green-100 text-green-800">
                          Sales Ready
                        </Badge>
                        <Button size="sm">
                          Contact Now
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lead Detail Modal */}
        {selectedLead && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedLead.contactId?.name?.full || selectedLead.contactId?.email}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">{selectedLead.contactId?.email}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedLead(null)}
                  >
                    Close
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Score Overview */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Lead Score Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center mb-4">
                          <div className={`w-24 h-24 rounded-full flex items-center justify-center font-bold text-white text-2xl mx-auto mb-2 ${
                            selectedLead.overallScore >= 80 ? 'bg-green-500' :
                            selectedLead.overallScore >= 60 ? 'bg-blue-500' :
                            selectedLead.overallScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}>
                            {selectedLead.overallScore}
                          </div>
                          <div className="flex justify-center space-x-2">
                            <Badge className={getGradeColor(selectedLead.leadGrade)}>
                              Grade {selectedLead.leadGrade}
                            </Badge>
                            <Badge className={getStatusColor(selectedLead.leadStatus)}>
                              {selectedLead.leadStatus}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Engagement Score</span>
                            <span className="font-medium">{selectedLead.scoreBreakdown.engagementScore}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Intent Score</span>
                            <span className="font-medium">{selectedLead.scoreBreakdown.intentScore}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Behavioral Score</span>
                            <span className="font-medium">{selectedLead.scoreBreakdown.behavioralScore}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Conversion Probability</span>
                            <span className="font-medium text-green-600">
                              {Math.round(selectedLead.conversionProbability * 100)}%
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Predicted Value */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Predicted Value</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600 mb-2">
                            {formatCurrency(selectedLead.predictedValue.amount)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Confidence: {Math.round(selectedLead.predictedValue.confidence * 100)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            Based on historical conversion patterns
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recommendations & Alerts */}
                  <div className="space-y-4">
                    {/* Recommendations */}
                    <Card>
                      <CardHeader>
                        <CardTitle>AI Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedLead.recommendations.map((rec, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium capitalize">{rec.type.replace('_', ' ')}</span>
                                <Badge className={getPriorityColor(rec.priority)}>
                                  {rec.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {rec.description}
                              </p>
                              <p className="text-sm font-medium text-blue-600">
                                {rec.suggestedAction}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Alerts */}
                    {selectedLead.alerts.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Recent Alerts</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {selectedLead.alerts.slice(0, 3).map((alert, index) => (
                              <div key={index} className="flex items-start space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium">{alert.message}</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {new Date(alert.triggeredAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};
