import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info, Zap, FileText, Image, Link, Eye } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

interface AccessibilityIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  element?: string;
  line?: number;
  message: string;
  suggestion?: string;
  wcagGuideline?: string;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  implementation: string;
}

interface AISuggestion {
  type: string;
  content: string;
  confidence: number;
  applied: boolean;
}

interface AccessibilityResult {
  score: number;
  issues: AccessibilityIssue[];
  recommendations: Recommendation[];
  complianceLevel: string;
  estimatedFixTime: number;
  aiSuggestions: AISuggestion[];
}

interface Email {
  _id: string;
  subject: string;
  sentAt: string;
}

export const EmailAccessibilityChecker: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<AccessibilityResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'recommendations' | 'ai-suggestions'>('overview');

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const response = await axios.get('/emails');
      setEmails(response.data.data);
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast.error('Failed to load emails');
    }
  };

  const checkAccessibility = async () => {
    if (!selectedEmail && !htmlContent.trim()) {
      toast.error('Please select an email or enter HTML content');
      return;
    }

    setChecking(true);
    try {
      const payload = selectedEmail
        ? { emailId: selectedEmail }
        : { htmlContent };

      const response = await axios.post('/accessibility/check', payload);
      setResult(response.data.data);
      toast.success('Accessibility check completed!');
    } catch (error) {
      console.error('Error checking accessibility:', error);
      toast.error('Failed to check accessibility');
    } finally {
      setChecking(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
      default: return <Info className="h-5 w-5 text-gray-500" />;
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

  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case 'missing_alt_text': return <Image className="h-4 w-4" />;
      case 'empty_links': return <Link className="h-4 w-4" />;
      case 'missing_headings': return <FileText className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const groupedIssues = result?.issues.reduce((acc, issue) => {
    if (!acc[issue.severity]) acc[issue.severity] = [];
    acc[issue.severity].push(issue);
    return acc;
  }, {} as Record<string, AccessibilityIssue[]>) || {};

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
              Email Accessibility Checker
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Ensure your emails meet WCAG accessibility standards
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Eye className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Check Email Accessibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Email (Optional)</label>
                <select
                  value={selectedEmail}
                  onChange={(e) => setSelectedEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose an email...</option>
                  {emails.map((email) => (
                    <option key={email._id} value={email._id}>
                      {email.subject} - {new Date(email.sentAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={checkAccessibility}
                  disabled={checking}
                  className="w-full"
                >
                  {checking ? 'Checking...' : 'Check Accessibility'}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Or Enter HTML Content</label>
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="Paste your email HTML content here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {result && (
          <>
            {/* Score Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Accessibility Score</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
                    {result.score}/100
                  </div>
                  <Badge className={`${getScoreBgColor(result.score)} mt-2`}>
                    WCAG {result.complianceLevel}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    {result.issues.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {groupedIssues.error?.length || 0} errors, {groupedIssues.warning?.length || 0} warnings
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Est. Fix Time</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {result.estimatedFixTime}m
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    minutes
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Suggestions</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {result.aiSuggestions.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    available
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Results Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Results</CardTitle>
                <div className="flex space-x-2">
                  {[
                    { key: 'overview', label: 'Overview' },
                    { key: 'issues', label: `Issues (${result.issues.length})` },
                    { key: 'recommendations', label: `Recommendations (${result.recommendations.length})` },
                    { key: 'ai-suggestions', label: `AI Suggestions (${result.aiSuggestions.length})` },
                  ].map(({ key, label }) => (
                    <Button
                      key={key}
                      variant={activeTab === key ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab(key as any)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Score Breakdown</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-red-600">{groupedIssues.error?.length || 0}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Errors (-10 pts each)</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">{groupedIssues.warning?.length || 0}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Warnings (-5 pts each)</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{groupedIssues.info?.length || 0}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Info (-2 pts each)</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-3">Compliance Level</h3>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">WCAG {result.complianceLevel} Compliance</span>
                          <Badge className={result.score >= 80 ? 'bg-green-100 text-green-800' : result.score >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                            {result.score >= 80 ? 'Excellent' : result.score >= 60 ? 'Good' : 'Needs Improvement'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {result.complianceLevel === 'AAA' && 'Highest level of accessibility compliance'}
                          {result.complianceLevel === 'AA' && 'Good accessibility compliance with some room for improvement'}
                          {result.complianceLevel === 'A' && 'Basic accessibility compliance - significant improvements needed'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'issues' && (
                  <div className="space-y-4">
                    {result.issues.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                        <p>No accessibility issues found!</p>
                      </div>
                    ) : (
                      result.issues.map((issue, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            {getSeverityIcon(issue.severity)}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium">{issue.message}</h4>
                                <Badge className={
                                  issue.severity === 'error' ? 'bg-red-100 text-red-800' :
                                  issue.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }>
                                  {issue.severity}
                                </Badge>
                              </div>

                              {issue.element && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  Element: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{issue.element}</code>
                                </p>
                              )}

                              {issue.suggestion && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded mb-2">
                                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Suggestion:</p>
                                  <p className="text-sm text-blue-700 dark:text-blue-300">{issue.suggestion}</p>
                                </div>
                              )}

                              {issue.wcagGuideline && (
                                <p className="text-xs text-gray-500">
                                  WCAG Guideline: {issue.wcagGuideline}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'recommendations' && (
                  <div className="space-y-4">
                    {result.recommendations.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                        <p>No recommendations needed!</p>
                      </div>
                    ) : (
                      result.recommendations.map((rec, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{rec.title}</h4>
                              <Badge className={getPriorityColor(rec.priority)}>
                                {rec.priority} priority
                              </Badge>
                            </div>
                            <span className="text-sm text-gray-500">{rec.category}</span>
                          </div>

                          <p className="text-gray-600 dark:text-gray-400 mb-3">{rec.description}</p>

                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-sm font-medium mb-1">Implementation:</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{rec.implementation}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'ai-suggestions' && (
                  <div className="space-y-4">
                    {result.aiSuggestions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No AI suggestions available</p>
                      </div>
                    ) : (
                      result.aiSuggestions.map((suggestion, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Zap className="h-5 w-5 text-purple-500" />
                              <h4 className="font-medium capitalize">{suggestion.type.replace('_', ' ')}</h4>
                            </div>
                            <Badge className="bg-purple-100 text-purple-800">
                              {Math.round(suggestion.confidence * 100)}% confidence
                            </Badge>
                          </div>

                          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
                            <p className="text-sm text-purple-800 dark:text-purple-200">{suggestion.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Help Section */}
        {!result && (
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">WCAG Compliance Levels</h4>
                  <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                    <li><strong>A:</strong> Basic accessibility (60-79 points)</li>
                    <li><strong>AA:</strong> Good accessibility (80-89 points)</li>
                    <li><strong>AAA:</strong> Excellent accessibility (90-100 points)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Common Issues</h4>
                  <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• Missing alt text on images</li>
                    <li>• Empty or generic link text</li>
                    <li>• Poor heading structure</li>
                    <li>• Missing language attributes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </DashboardLayout>
  );
};
