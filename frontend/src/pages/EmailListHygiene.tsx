import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, XCircle, Trash2, Download, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

interface HygieneStats {
  total: number;
  clean: number;
  warning: number;
  risky: number;
  invalid: number;
  avgHealthScore: number;
}

interface ValidationResult {
  email: string;
  status: 'clean' | 'warning' | 'risky' | 'invalid' | 'error';
  issues: string[];
  healthScore: number;
}

interface HygieneReport {
  summary: HygieneStats;
  records: any[];
}

export const EmailListHygiene: React.FC = () => {
  const [report, setReport] = useState<HygieneReport | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [emailsToValidate, setEmailsToValidate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'validate' | 'clean'>('overview');

  useEffect(() => {
    fetchHygieneReport();
  }, []);

  const fetchHygieneReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/hygiene/report');
      setReport(response.data.data);
    } catch (error) {
      console.error('Error fetching hygiene report:', error);
      toast.error('Failed to load hygiene report');
    } finally {
      setLoading(false);
    }
  };

  const validateEmails = async () => {
    if (!emailsToValidate.trim()) {
      toast.error('Please enter emails to validate');
      return;
    }

    const emailList = emailsToValidate
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    if (emailList.length === 0) {
      toast.error('No valid emails found');
      return;
    }

    setValidating(true);
    try {
      const response = await axios.post('/hygiene/validate-list', {
        emails: emailList,
        source: 'manual',
      });
      setValidationResults(response.data.data.details);
      toast.success(`Validated ${emailList.length} emails`);
    } catch (error) {
      console.error('Error validating emails:', error);
      toast.error('Failed to validate emails');
    } finally {
      setValidating(false);
    }
  };

  const cleanEmailList = async (action: string) => {
    try {
      const response = await axios.post('/hygiene/clean-list', { action });
      toast.success('Email list cleaning completed');
      await fetchHygieneReport();
      console.log('Cleaning results:', response.data.data);
    } catch (error) {
      console.error('Error cleaning email list:', error);
      toast.error('Failed to clean email list');
    }
  };

  const reengageInactive = async () => {
    try {
      const response = await axios.post('/hygiene/re-engage-inactive');
      toast.success('Re-engagement campaigns created');
      console.log('Re-engagement results:', response.data.data);
    } catch (error) {
      console.error('Error creating re-engagement campaigns:', error);
      toast.error('Failed to create re-engagement campaigns');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clean': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'risky': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'invalid': return 'bg-red-100 text-red-800 border-red-200';
      case 'error': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'clean': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'risky': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'invalid': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

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
              Email List Hygiene
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Validate, clean, and maintain healthy email lists for better deliverability
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2">
          {[
            { key: 'overview', label: 'Overview', icon: Shield },
            { key: 'validate', label: 'Validate Emails', icon: CheckCircle },
            { key: 'clean', label: 'Clean Lists', icon: Trash2 },
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
            {/* Hygiene Stats */}
            {report && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{report.summary.total}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clean</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{report.summary.clean}</div>
                    <div className="text-xs text-gray-500">
                      {report.summary.total > 0 ? Math.round((report.summary.clean / report.summary.total) * 100) : 0}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Warnings</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{report.summary.warning}</div>
                    <div className="text-xs text-gray-500">
                      {report.summary.total > 0 ? Math.round((report.summary.warning / report.summary.total) * 100) : 0}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Risky</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{report.summary.risky}</div>
                    <div className="text-xs text-gray-500">
                      {report.summary.total > 0 ? Math.round((report.summary.risky / report.summary.total) * 100) : 0}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Invalid</CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{report.summary.invalid}</div>
                    <div className="text-xs text-gray-500">
                      {report.summary.total > 0 ? Math.round((report.summary.invalid / report.summary.total) * 100) : 0}%
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Average Health Score */}
            {report && (
              <Card>
                <CardHeader>
                  <CardTitle>Average Health Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className={`text-4xl font-bold ${getHealthScoreColor(report.summary.avgHealthScore)}`}>
                      {Math.round(report.summary.avgHealthScore)}/100
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                        <div
                          className={`h-4 rounded-full transition-all duration-300 ${
                            report.summary.avgHealthScore >= 80 ? 'bg-green-500' :
                            report.summary.avgHealthScore >= 60 ? 'bg-blue-500' :
                            report.summary.avgHealthScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${report.summary.avgHealthScore}%` }}
                        />
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {report.summary.avgHealthScore >= 80 ? 'Excellent health' :
                         report.summary.avgHealthScore >= 60 ? 'Good health' :
                         report.summary.avgHealthScore >= 40 ? 'Fair health' : 'Poor health'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Records */}
            {report && report.records.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Hygiene Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.records.slice(0, 10).map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(record.hygieneStatus)}
                          <div>
                            <div className="font-medium">{record.email}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Health Score: <span className={getHealthScoreColor(record.healthScore)}>
                                {record.healthScore}/100
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(record.hygieneStatus)}>
                          {record.hygieneStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Validate Tab */}
        {activeTab === 'validate' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Validate Email List</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Check email deliverability and identify potential issues
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Enter emails to validate (one per line)
                  </label>
                  <textarea
                    value={emailsToValidate}
                    onChange={(e) => setEmailsToValidate(e.target.value)}
                    placeholder="email1@example.com
email2@example.com
email3@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={8}
                  />
                </div>
                <Button
                  onClick={validateEmails}
                  disabled={validating}
                  className="w-full"
                >
                  {validating ? 'Validating...' : 'Validate Emails'}
                </Button>
              </CardContent>
            </Card>

            {/* Validation Results */}
            {validationResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Validation Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {validationResults.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(result.status)}
                          <div>
                            <div className="font-medium">{result.email}</div>
                            {result.issues.length > 0 && (
                              <div className="text-sm text-red-600">
                                {result.issues[0]}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${getHealthScoreColor(result.healthScore)}`}>
                            {result.healthScore}/100
                          </span>
                          <Badge className={getStatusColor(result.status)}>
                            {result.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Clean Tab */}
        {activeTab === 'clean' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Clean Email List</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Remove invalid emails and improve list health
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => cleanEmailList('report')}
                    variant="outline"
                    className="flex flex-col items-center space-y-2 p-6"
                  >
                    <Download className="h-8 w-8" />
                    <span>Generate Report</span>
                  </Button>

                  <Button
                    onClick={() => cleanEmailList('flag_risky')}
                    variant="outline"
                    className="flex flex-col items-center space-y-2 p-6"
                  >
                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    <span>Flag Risky Emails</span>
                  </Button>

                  <Button
                    onClick={() => cleanEmailList('remove_invalid')}
                    variant="danger"
                    className="flex flex-col items-center space-y-2 p-6"
                  >
                    <Trash2 className="h-8 w-8" />
                    <span>Remove Invalid</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Re-engagement Campaigns</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create campaigns to win back inactive subscribers
                </p>
              </CardHeader>
              <CardContent>
                <Button onClick={reengageInactive} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Create Re-engagement Campaigns
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cleaning Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-green-600">Safe Actions</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                      <li>• Generate reports to review list health</li>
                      <li>• Flag risky emails for manual review</li>
                      <li>• Create re-engagement campaigns</li>
                    </ul>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-red-600">Destructive Actions</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                      <li>• Removing invalid emails is permanent</li>
                      <li>• Consider legal requirements before removal</li>
                      <li>• Backup your list before cleaning</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};
