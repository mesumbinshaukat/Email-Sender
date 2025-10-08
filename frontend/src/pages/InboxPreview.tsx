import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Monitor, Smartphone, Mail, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

interface Preview {
  client: string;
  device: string;
  score: number;
  issues: any[];
  html?: string;
  text?: string;
}

const InboxPreview = () => {
  const [emailId, setEmailId] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const clients = [
    { name: 'gmail', label: 'Gmail', icon: Mail },
    { name: 'outlook', label: 'Outlook', icon: Mail },
    { name: 'yahoo', label: 'Yahoo Mail', icon: Mail },
    { name: 'apple_mail', label: 'Apple Mail', icon: Mail },
    { name: 'thunderbird', label: 'Thunderbird', icon: Mail },
    { name: 'iphone', label: 'iPhone', icon: Smartphone },
    { name: 'android', label: 'Android', icon: Smartphone },
    { name: 'webmail', label: 'Webmail', icon: Monitor }
  ];

  const generatePreview = async () => {
    if (!emailId) {
      toast.error('Please enter an email ID');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/inbox-preview/generate', { emailId });
      setPreview(data);
      toast.success('Preview generated successfully!');
    } catch (error) {
      toast.error('Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const regeneratePreview = async () => {
    if (!preview) return;

    setLoading(true);
    try {
      const { data } = await axios.post(`/api/inbox-preview/${preview._id}/regenerate`);
      setPreview(data);
      toast.success('Preview regenerated!');
    } catch (error) {
      toast.error('Failed to regenerate preview');
    } finally {
      setLoading(false);
    }
  };

  const getClientIcon = (clientName: string) => {
    const client = clients.find(c => c.name === clientName);
    return client?.icon || Mail;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getIssueSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPreviewByClient = (clientName: string) => {
    return preview?.previews?.find((p: Preview) => p.client === clientName);
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
            <Monitor className="h-8 w-8 text-blue-600" />
            Inbox Preview
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Preview how your emails will look across 90+ email clients and devices
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8"
        >
          <div className="flex gap-4">
            <input
              type="text"
              value={emailId}
              onChange={(e) => setEmailId(e.target.value)}
              placeholder="Enter Email ID to preview"
              className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
            <button
              onClick={generatePreview}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Preview'}
            </button>
            {preview && (
              <button
                onClick={regeneratePreview}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </button>
            )}
          </div>
        </motion.div>

        {preview && (
          <>
            {/* Overall Score */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Overall Compatibility Score</h2>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(preview.overallScore)}`}>
                    {preview.overallScore}/100
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {preview.previews?.filter((p: Preview) => p.score >= 80).length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Excellent (80-100)</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {preview.previews?.filter((p: Preview) => p.score >= 60 && p.score < 80).length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Good (60-79)</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {preview.previews?.filter((p: Preview) => p.score < 60).length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Needs Improvement (&lt;60)</div>
                </div>
              </div>

              {/* Recommendations */}
              {preview.recommendations && preview.recommendations.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
                  <div className="space-y-2">
                    {preview.recommendations.map((rec: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="font-medium">{rec.message}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{rec.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Client Previews */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {clients.map(client => {
                const clientPreview = getPreviewByClient(client.name);
                const IconComponent = getClientIcon(client.name);

                return (
                  <div
                    key={client.name}
                    onClick={() => setSelectedClient(client.name)}
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer transition-all ${
                      selectedClient === client.name ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <IconComponent className="h-6 w-6 text-gray-600" />
                      <span className={`px-2 py-1 text-xs rounded ${getScoreColor(clientPreview?.score || 0)}`}>
                        {clientPreview?.score || 0}
                      </span>
                    </div>

                    <h3 className="font-medium text-sm mb-2">{client.label}</h3>

                    {clientPreview?.issues?.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        {clientPreview.issues.length} issues
                      </div>
                    )}

                    {(!clientPreview?.issues || clientPreview.issues.length === 0) && clientPreview && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        No issues
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>

            {/* Detailed View */}
            {selectedClient && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">
                    {clients.find(c => c.name === selectedClient)?.label} Preview
                  </h2>
                  <button
                    onClick={() => setSelectedClient(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {(() => {
                  const clientPreview = getPreviewByClient(selectedClient);
                  if (!clientPreview) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        Preview not available for this client
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {/* Score and Issues */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-semibold mb-3">Compatibility Score</h3>
                          <div className={`text-3xl font-bold ${getScoreColor(clientPreview.score)}`}>
                            {clientPreview.score}/100
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Issues Found</h3>
                          {clientPreview.issues?.length > 0 ? (
                            <div className="space-y-2">
                              {clientPreview.issues.map((issue: any, index: number) => (
                                <div key={index} className="flex items-start gap-2">
                                  <AlertTriangle className={`h-4 w-4 mt-0.5 ${getIssueSeverityColor(issue.severity).split(' ')[0]}`} />
                                  <div>
                                    <p className="text-sm font-medium">{issue.message}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{issue.suggestion}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>No issues detected</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* HTML Preview */}
                      {clientPreview.html && (
                        <div>
                          <h3 className="font-semibold mb-3">Rendered Preview</h3>
                          <div className="border rounded-lg p-4 max-h-96 overflow-auto bg-gray-50 dark:bg-gray-700">
                            <div dangerouslySetInnerHTML={{ __html: clientPreview.html }} />
                          </div>
                        </div>
                      )}

                      {/* Text Version */}
                      {clientPreview.text && (
                        <div>
                          <h3 className="font-semibold mb-3">Text Version</h3>
                          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                            <pre className="whitespace-pre-wrap text-sm">{clientPreview.text}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </>
        )}

        {!preview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Monitor className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Email Inbox Preview
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Ensure your emails look perfect across all major email clients and devices.
              Our AI-powered preview system checks for compatibility issues and provides
              actionable recommendations to improve deliverability and user experience.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {clients.slice(0, 8).map(client => {
                const IconComponent = getClientIcon(client.name);
                return (
                  <div key={client.name} className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <IconComponent className="h-8 w-8 text-gray-600 mb-2" />
                    <span className="text-sm text-center">{client.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InboxPreview;
