import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, XCircle, AlertTriangle, RefreshCw, Key } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

interface AuthSetup {
  _id: string;
  domain: string;
  status: string;
  spf: any;
  dkim: any;
  dmarc: any;
  verificationResults: any;
  recommendations: any[];
  createdAt: string;
}

const EmailAuthentication = () => {
  const [authSetups, setAuthSetups] = useState<AuthSetup[]>([]);
  const [selectedSetup, setSelectedSetup] = useState<AuthSetup | null>(null);
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [formData, setFormData] = useState({
    domain: ''
  });
  const [setupInstructions, setSetupInstructions] = useState<any>(null);

  useEffect(() => {
    fetchAuthSetups();
  }, []);

  const fetchAuthSetups = async () => {
    try {
      const { data } = await axios.get('/api/email-auth');
      setAuthSetups(data);
    } catch (error) {
      toast.error('Failed to fetch authentication setups');
    }
  };

  const setupAuthentication = async () => {
    if (!formData.domain) {
      toast.error('Please enter a domain');
      return;
    }

    try {
      const { data } = await axios.post('/api/email-auth/setup', formData);
      setAuthSetups([data, ...authSetups]);
      setSetupInstructions(data.instructions);
      setFormData({ domain: '' });
      setShowSetupForm(false);
      toast.success('Authentication setup created!');
    } catch (error) {
      toast.error('Failed to setup authentication');
    }
  };

  const verifySetup = async (setupId: string) => {
    try {
      const { data } = await axios.post(`/api/email-auth/${setupId}/verify`);
      // Update the setup in the list
      setAuthSetups(authSetups.map(setup =>
        setup._id === setupId ? data : setup
      ));
      if (selectedSetup?._id === setupId) {
        setSelectedSetup(data);
      }
      toast.success('Verification completed!');
    } catch (error) {
      toast.error('Verification failed');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'verifying': return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default: return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'verifying': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
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
            <Shield className="h-8 w-8 text-blue-600" />
            Email Authentication
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Protect your domain and improve deliverability with SPF, DKIM, and DMARC
          </p>
        </motion.div>

        <div className="mb-6">
          <button
            onClick={() => setShowSetupForm(!showSetupForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Key className="h-4 w-4" />
            Setup Authentication
          </button>
        </div>

        {showSetupForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6"
          >
            <h2 className="text-xl font-semibold mb-4">Setup Email Authentication</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Domain</label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="example.com"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Enter the domain you want to authenticate for email sending
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>What we'll set up:</strong>
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                <li>• SPF record to prevent spoofing</li>
                <li>• DKIM signature for email authentication</li>
                <li>• DMARC policy for delivery monitoring</li>
              </ul>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={setupAuthentication}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Generate Setup
              </button>
              <button
                onClick={() => setShowSetupForm(false)}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {setupInstructions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6"
          >
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-4">
              Setup Instructions Generated!
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200">1. SPF Record</h4>
                <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                  Add this TXT record to your DNS settings:
                </p>
                <code className="block bg-green-100 dark:bg-green-800 p-3 rounded text-sm font-mono">
                  {setupInstructions.spf}
                </code>
              </div>

              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200">2. DKIM Record</h4>
                <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                  Add this TXT record to your DNS settings:
                </p>
                <code className="block bg-green-100 dark:bg-green-800 p-3 rounded text-sm font-mono break-all">
                  {setupInstructions.dkim}
                </code>
              </div>

              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200">3. DMARC Record</h4>
                <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                  Add this TXT record to your DNS settings:
                </p>
                <code className="block bg-green-100 dark:bg-green-800 p-3 rounded text-sm font-mono break-all">
                  {setupInstructions.dmarc}
                </code>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setSetupInstructions(null)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Auth Setups List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-semibold">Your Domains</h2>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {authSetups.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No authentication setups yet. Protect your domain by setting up SPF, DKIM, and DMARC.
                  </div>
                ) : (
                  authSetups.map(setup => (
                    <div key={setup._id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{setup.domain}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(setup.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {setup.verificationResults && (
                            <span className={`text-sm font-medium ${getScoreColor(setup.verificationResults.overallScore)}`}>
                              {setup.verificationResults.overallScore}/100
                            </span>
                          )}
                          {getStatusIcon(setup.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                        <div className="text-center">
                          <div className={`font-medium ${setup.spf?.verified ? 'text-green-600' : 'text-red-600'}`}>
                            SPF
                          </div>
                          <div className={setup.spf?.verified ? 'text-green-600' : 'text-red-600'}>
                            {setup.spf?.verified ? '✓' : '✗'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className={`font-medium ${setup.dkim?.verified ? 'text-green-600' : 'text-red-600'}`}>
                            DKIM
                          </div>
                          <div className={setup.dkim?.verified ? 'text-green-600' : 'text-red-600'}>
                            {setup.dkim?.verified ? '✓' : '✗'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className={`font-medium ${setup.dmarc?.verified ? 'text-green-600' : 'text-red-600'}`}>
                            DMARC
                          </div>
                          <div className={setup.dmarc?.verified ? 'text-green-600' : 'text-red-600'}>
                            {setup.dmarc?.verified ? '✓' : '✗'}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => verifySetup(setup._id)}
                          disabled={setup.status === 'verifying'}
                          className="text-blue-600 hover:text-blue-700 text-sm disabled:opacity-50"
                        >
                          {setup.status === 'verifying' ? 'Verifying...' : 'Verify'}
                        </button>
                        <button
                          onClick={() => setSelectedSetup(setup)}
                          className="text-green-600 hover:text-green-700 text-sm"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* Details Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {selectedSetup ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-6">
                  {selectedSetup.domain} - Authentication Details
                </h2>

                {/* Verification Results */}
                {selectedSetup.verificationResults && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Verification Results</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className={`text-2xl font-bold ${getScoreColor(selectedSetup.verificationResults.overallScore)}`}>
                          {selectedSetup.verificationResults.overallScore}/100
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Overall Score</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className={`text-2xl font-bold ${getStatusColor(selectedSetup.status)}`}>
                          {selectedSetup.status}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Protocol Details */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Protocol Details</h3>
                  <div className="space-y-4">
                    {/* SPF */}
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">SPF (Sender Policy Framework)</h4>
                        <span className={selectedSetup.spf?.verified ? 'text-green-600' : 'text-red-600'}>
                          {selectedSetup.spf?.verified ? '✓ Verified' : '✗ Not Verified'}
                        </span>
                      </div>
                      {selectedSetup.spf?.record && (
                        <code className="block text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-2 break-all">
                          {selectedSetup.spf.record}
                        </code>
                      )}
                      {selectedSetup.spf?.errors?.length > 0 && (
                        <div className="mt-2 text-sm text-red-600">
                          {selectedSetup.spf.errors.join(', ')}
                        </div>
                      )}
                    </div>

                    {/* DKIM */}
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">DKIM (DomainKeys Identified Mail)</h4>
                        <span className={selectedSetup.dkim?.verified ? 'text-green-600' : 'text-red-600'}>
                          {selectedSetup.dkim?.verified ? '✓ Verified' : '✗ Not Verified'}
                        </span>
                      </div>
                      {selectedSetup.dkim?.selector && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Selector: {selectedSetup.dkim.selector}
                        </div>
                      )}
                      {selectedSetup.dkim?.errors?.length > 0 && (
                        <div className="mt-2 text-sm text-red-600">
                          {selectedSetup.dkim.errors.join(', ')}
                        </div>
                      )}
                    </div>

                    {/* DMARC */}
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">DMARC (Domain-based Message Authentication)</h4>
                        <span className={selectedSetup.dmarc?.verified ? 'text-green-600' : 'text-red-600'}>
                          {selectedSetup.dmarc?.verified ? '✓ Verified' : '✗ Not Verified'}
                        </span>
                      </div>
                      {selectedSetup.dmarc?.policy && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Policy: {selectedSetup.dmarc.policy}
                        </div>
                      )}
                      {selectedSetup.dmarc?.errors?.length > 0 && (
                        <div className="mt-2 text-sm text-red-600">
                          {selectedSetup.dmarc.errors.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {selectedSetup.recommendations && selectedSetup.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
                    <div className="space-y-3">
                      {selectedSetup.recommendations.map((rec: any, index: number) => (
                        <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900 rounded">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-blue-800 dark:text-blue-200">{rec.message}</p>
                              <p className="text-sm text-blue-600 dark:text-blue-400">{rec.solution}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="text-center py-12">
                  <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a domain to view details
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose a domain from the list to see authentication status, verification results, and setup recommendations.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
    </div>
      </DashboardLayout>
  );
};

export default EmailAuthentication;
