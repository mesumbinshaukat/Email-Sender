import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, XCircle, FileText, Scale, Eye } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

interface ComplianceResult {
  score: number;
  violations: Array<{
    rule: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    suggestion?: string;
    location?: string;
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    description: string;
    implementation: string;
    deadline?: string;
  }>;
  status: 'compliant' | 'warning' | 'non_compliant';
  jurisdiction: string;
}

interface PolicyData {
  type: string;
  content: string;
  jurisdiction: string;
}

export const ComplianceAssistant: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'checker' | 'policies' | 'audit'>('checker');
  const [selectedCompliance, setSelectedCompliance] = useState<string>('gdpr');
  const [emailContent, setEmailContent] = useState<string>('');
  const [checking, setChecking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [generatedPolicy, setGeneratedPolicy] = useState<PolicyData | null>(null);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    industry: '',
    location: '',
    website: '',
  });

  const complianceTypes = [
    { id: 'gdpr', name: 'GDPR', description: 'EU General Data Protection Regulation', flag: '🇪🇺' },
    { id: 'can_spam', name: 'CAN-SPAM', description: 'US Commercial Email Regulations', flag: '🇺🇸' },
    { id: 'casl', name: 'CASL', description: 'Canada Anti-Spam Legislation', flag: '🇨🇦' },
    { id: 'ccpa', name: 'CCPA', description: 'California Consumer Privacy Act', flag: '🇺🇸' },
  ];

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLog();
    }
  }, [activeTab]);

  const checkCompliance = async () => {
    if (!emailContent.trim()) {
      toast.error('Please enter email content to check');
      return;
    }

    setChecking(true);
    try {
      const response = await axios.post(`/compliance/check/${selectedCompliance}`, {
        content: emailContent,
        jurisdiction: 'global',
      });
      setResult(response.data.data);
      toast.success('Compliance check completed!');
    } catch (error: any) {
      console.error('Error checking compliance:', error);
      toast.error(error.response?.data?.message || 'Failed to check compliance');
    } finally {
      setChecking(false);
    }
  };

  const generatePolicy = async (type: string) => {
    if (!companyInfo.name || !companyInfo.industry) {
      toast.error('Please fill in company name and industry');
      return;
    }

    setGenerating(true);
    try {
      const response = await axios.post('/compliance/generate-policy', {
        type,
        companyInfo,
        jurisdiction: 'global',
      });
      setGeneratedPolicy(response.data.data);
      toast.success('Policy generated successfully!');
    } catch (error: any) {
      console.error('Error generating policy:', error);
      toast.error(error.response?.data?.message || 'Failed to generate policy');
    } finally {
      setGenerating(false);
    }
  };

  const fetchAuditLog = async () => {
    try {
      const response = await axios.get('/compliance/audit-log?limit=20');
      setAuditLog(response.data.data);
    } catch (error) {
      console.error('Error fetching audit log:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'non_compliant': return 'bg-red-100 text-red-800 border-red-200';
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
              Compliance Assistant
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Ensure your emails comply with global regulations and best practices
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-500" />
            <Scale className="h-8 w-8 text-green-500" />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2">
          {[
            { key: 'checker', label: 'Compliance Checker', icon: Shield },
            { key: 'policies', label: 'Policy Generator', icon: FileText },
            { key: 'audit', label: 'Audit Log', icon: Eye },
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

        {/* Compliance Checker Tab */}
        {activeTab === 'checker' && (
          <div className="space-y-6">
            {/* Compliance Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Compliance Standard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {complianceTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedCompliance(type.id)}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        selectedCompliance === type.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{type.flag}</div>
                      <div className="font-medium">{type.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {type.description}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Email Content Input */}
            <Card>
              <CardHeader>
                <CardTitle>Email Content to Check</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Paste your email HTML or text content here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={10}
                />
                <Button
                  onClick={checkCompliance}
                  disabled={checking}
                  className="w-full"
                >
                  {checking ? 'Checking...' : `Check ${complianceTypes.find(t => t.id === selectedCompliance)?.name} Compliance`}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            {result && (
              <div className="space-y-6">
                {/* Score Overview */}
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center font-bold text-white text-2xl mx-auto mb-2 ${
                        result.score >= 80 ? 'bg-green-500' :
                        result.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        {result.score}
                      </div>
                      <Badge className={getStatusColor(result.status)}>
                        {result.status.toUpperCase()}
                      </Badge>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {complianceTypes.find(t => t.id === selectedCompliance)?.name} Compliance Score
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Violations */}
                {result.violations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                        Compliance Violations ({result.violations.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {result.violations.map((violation, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {violation.severity === 'critical' && <XCircle className="h-5 w-5 text-red-500" />}
                                {violation.severity === 'high' && <AlertTriangle className="h-5 w-5 text-orange-500" />}
                                {violation.severity === 'medium' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                                {violation.severity === 'low' && <AlertTriangle className="h-5 w-5 text-blue-500" />}
                                <span className="font-medium capitalize">{violation.rule.replace('_', ' ')}</span>
                              </div>
                              <Badge className={getSeverityColor(violation.severity)}>
                                {violation.severity}
                              </Badge>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 mb-2">{violation.description}</p>
                            {violation.suggestion && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Suggestion:</p>
                                <p className="text-sm text-blue-700 dark:text-blue-300">{violation.suggestion}</p>
                              </div>
                            )}
                            {violation.location && (
                              <p className="text-xs text-gray-500 mt-2">
                                Location: {violation.location}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                {result.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {result.recommendations.map((rec, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{rec.action.replace('_', ' ')}</h4>
                              <Badge className={getPriorityColor(rec.priority)}>
                                {rec.priority} priority
                              </Badge>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-2">{rec.description}</p>
                            <div className="bg-gray-50 p-3 rounded">
                              <p className="text-sm font-medium mb-1">Implementation:</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{rec.implementation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* Policy Generator Tab */}
        {activeTab === 'policies' && (
          <div className="space-y-6">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Required for generating legally compliant policies
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Company Name</label>
                    <input
                      type="text"
                      value={companyInfo.name}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your Company Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Industry</label>
                    <input
                      type="text"
                      value={companyInfo.industry}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, industry: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Technology, Healthcare"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <input
                      type="text"
                      value={companyInfo.location}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., United States, EU"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Website</label>
                    <input
                      type="url"
                      value={companyInfo.website}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://yourcompany.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Policy Types */}
            <Card>
              <CardHeader>
                <CardTitle>Generate Compliance Policies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => generatePolicy('privacy_policy')}
                    disabled={generating}
                    className="flex flex-col items-center space-y-2 p-6 h-auto"
                  >
                    <Shield className="h-8 w-8" />
                    <span>Privacy Policy</span>
                    <span className="text-xs text-gray-500">GDPR, CCPA compliant</span>
                  </Button>

                  <Button
                    onClick={() => generatePolicy('terms_of_service')}
                    disabled={generating}
                    variant="outline"
                    className="flex flex-col items-center space-y-2 p-6 h-auto"
                  >
                    <FileText className="h-8 w-8" />
                    <span>Terms of Service</span>
                    <span className="text-xs text-gray-500">Legal agreements</span>
                  </Button>

                  <Button
                    onClick={() => generatePolicy('cookie_policy')}
                    disabled={generating}
                    variant="outline"
                    className="flex flex-col items-center space-y-2 p-6 h-auto"
                  >
                    <Scale className="h-8 w-8" />
                    <span>Cookie Policy</span>
                    <span className="text-xs text-gray-500">GDPR cookie compliance</span>
                  </Button>

                  <Button
                    onClick={() => generatePolicy('data_processing_agreement')}
                    disabled={generating}
                    variant="outline"
                    className="flex flex-col items-center space-y-2 p-6 h-auto"
                  >
                    <CheckCircle className="h-8 w-8" />
                    <span>Data Processing</span>
                    <span className="text-xs text-gray-500">GDPR Article 28</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Generated Policy Display */}
            {generatedPolicy && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Generated {generatedPolicy.type.replace('_', ' ')}
                    <Badge className="bg-green-100 text-green-800">
                      {generatedPolicy.jurisdiction.toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm font-mono">{generatedPolicy.content}</pre>
                  </div>
                  <div className="flex justify-end mt-4 space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(generatedPolicy.content)}
                    >
                      Copy to Clipboard
                    </Button>
                    <Button>
                      Download PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <Card>
            <CardHeader>
              <CardTitle>Compliance Audit Log</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track all compliance-related activities and changes
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {auditLog.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No audit log entries found
                  </div>
                ) : (
                  auditLog.map((entry, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        {entry.action === 'check_performed' && <Shield className="h-5 w-5 text-blue-500" />}
                        {entry.action === 'policy_generated' && <FileText className="h-5 w-5 text-green-500" />}
                        {entry.action === 'consent_recorded' && <CheckCircle className="h-5 w-5 text-purple-500" />}
                        {entry.action === 'violation_fixed' && <AlertTriangle className="h-5 w-5 text-orange-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium capitalize">{entry.action.replace('_', ' ')}</span>
                          <Badge className="text-xs" variant="outline">
                            {entry.complianceType?.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{entry.details}</p>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </DashboardLayout>
  );
};
