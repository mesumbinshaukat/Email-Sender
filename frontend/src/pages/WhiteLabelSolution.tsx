import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Palette, Globe, Mail, Settings, CheckCircle, XCircle } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

interface WhiteLabelSettings {
  branding: {
    companyName: string;
    logo: string;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
  domain: {
    customDomain: string;
    isVerified: boolean;
  };
  emailSettings: {
    fromName: string;
    fromEmail: string;
    replyToEmail?: string;
  };
  features: {
    removeBranding: boolean;
    customIntegrations: boolean;
    apiAccess: boolean;
  };
}

// Ensure we always have a fully-populated settings object to avoid undefined property access
const normalizeSettings = (input: Partial<WhiteLabelSettings> | null | undefined): WhiteLabelSettings => {
  const defaults: WhiteLabelSettings = {
    branding: {
      companyName: 'Your Company',
      logo: '',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      fontFamily: 'Inter',
    },
    domain: {
      customDomain: '',
      isVerified: false,
    },
    emailSettings: {
      fromName: 'Your Company',
      fromEmail: 'noreply@example.com',
      replyToEmail: '',
    },
    features: {
      removeBranding: false,
      customIntegrations: false,
      apiAccess: false,
    },
  };

  const safe = input ?? {} as Partial<WhiteLabelSettings>;
  return {
    branding: {
      companyName: safe.branding?.companyName ?? defaults.branding.companyName,
      logo: safe.branding?.logo ?? defaults.branding.logo,
      primaryColor: safe.branding?.primaryColor ?? defaults.branding.primaryColor,
      secondaryColor: safe.branding?.secondaryColor ?? defaults.branding.secondaryColor,
      fontFamily: safe.branding?.fontFamily ?? defaults.branding.fontFamily,
    },
    domain: {
      customDomain: safe.domain?.customDomain ?? defaults.domain.customDomain,
      isVerified: safe.domain?.isVerified ?? defaults.domain.isVerified,
    },
    emailSettings: {
      fromName: safe.emailSettings?.fromName ?? defaults.emailSettings.fromName,
      fromEmail: safe.emailSettings?.fromEmail ?? defaults.emailSettings.fromEmail,
      replyToEmail: safe.emailSettings?.replyToEmail ?? defaults.emailSettings.replyToEmail,
    },
    features: {
      removeBranding: safe.features?.removeBranding ?? defaults.features.removeBranding,
      customIntegrations: safe.features?.customIntegrations ?? defaults.features.customIntegrations,
      apiAccess: safe.features?.apiAccess ?? defaults.features.apiAccess,
    },
  };
};

const WhiteLabelSolution = () => {
  const [settings, setSettings] = useState<WhiteLabelSettings | null>(null);
  const [showBrandingForm, setShowBrandingForm] = useState(false);
  const [showDomainForm, setShowDomainForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get('/api/white-label');
      const payload = (data && (data as any).data) ? (data as any).data : data;
      setSettings(normalizeSettings(payload));
    } catch (error) {
      toast.error('Failed to load white label settings');
      // Fall back to defaults if API fails
      setSettings(normalizeSettings(null));
    }
  };

  const updateBranding = async (branding: any) => {
    setLoading(true);
    try {
      const { data } = await axios.put('/api/white-label/branding', { branding });
      const payload = (data && (data as any).data) ? (data as any).data : data;
      setSettings(normalizeSettings(payload));
      setShowBrandingForm(false);
      toast.success('Branding updated successfully!');
    } catch (error) {
      toast.error('Failed to update branding');
    } finally {
      setLoading(false);
    }
  };

  const updateDomain = async (domain: any) => {
    setLoading(true);
    try {
      const { data } = await axios.put('/api/white-label/domain', { domain });
      const payload = (data && (data as any).data) ? (data as any).data : data;
      setSettings(normalizeSettings(payload));
      setShowDomainForm(false);
      toast.success('Domain settings updated!');
    } catch (error) {
      toast.error('Failed to update domain');
    } finally {
      setLoading(false);
    }
  };

  const updateEmailSettings = async (emailSettings: any) => {
    setLoading(true);
    try {
      const { data } = await axios.put('/api/white-label/email', { emailSettings });
      const payload = (data && (data as any).data) ? (data as any).data : data;
      setSettings(normalizeSettings(payload));
      setShowEmailForm(false);
      toast.success('Email settings updated!');
    } catch (error) {
      toast.error('Failed to update email settings');
    } finally {
      setLoading(false);
    }
  };

  const verifyDomain = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post('/api/white-label/verify-domain');
      setSettings(prev => prev ? { ...prev, domain: { ...prev.domain, isVerified: data.verified } } : null);
      toast.success(data.message);
    } catch (error) {
      toast.error('Domain verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading white label settings...</p>
        </div>
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
            <Palette className="h-8 w-8 text-blue-600" />
            White Label Solution
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Customize your email platform with your branding and domain
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Branding Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Palette className="h-5 w-5 text-blue-600" />
                Branding
              </h2>
              <button
                onClick={() => setShowBrandingForm(!showBrandingForm)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Company:</span>
                <p className="font-medium">{settings?.branding?.companyName ?? 'Your Company'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Primary Color:</span>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: settings?.branding?.primaryColor ?? '#3b82f6' }}
                  ></div>
                  <span className="text-sm font-mono">{settings?.branding?.primaryColor ?? '#3b82f6'}</span>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Font:</span>
                <p className="font-medium">{settings?.branding?.fontFamily ?? 'Inter'}</p>
              </div>
            </div>
          </motion.div>

          {/* Domain Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Globe className="h-5 w-5 text-green-600" />
                Custom Domain
              </h2>
              <button
                onClick={() => setShowDomainForm(!showDomainForm)}
                className="text-green-600 hover:text-green-700"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Domain:</span>
                <p className="font-medium">{settings?.domain?.customDomain || 'Not configured'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                {settings?.domain?.isVerified ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <XCircle className="h-4 w-4" />
                    Not Verified
                  </span>
                )}
              </div>
              {settings?.domain?.customDomain && !settings?.domain?.isVerified && (
                <button
                  onClick={verifyDomain}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify Domain'}
                </button>
              )}
            </div>
          </motion.div>

          {/* Email Settings Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5 text-purple-600" />
                Email Settings
              </h2>
              <button
                onClick={() => setShowEmailForm(!showEmailForm)}
                className="text-purple-600 hover:text-purple-700"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">From Name:</span>
                <p className="font-medium">{settings?.emailSettings?.fromName || 'Default'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">From Email:</span>
                <p className="font-medium">{settings?.emailSettings?.fromEmail || 'Default'}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Branding Form Modal */}
        {showBrandingForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Update Branding</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                updateBranding({
                  companyName: formData.get('companyName'),
                  primaryColor: formData.get('primaryColor'),
                  secondaryColor: formData.get('secondaryColor'),
                  fontFamily: formData.get('fontFamily')
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Company Name</label>
                    <input
                      name="companyName"
                      defaultValue={settings?.branding?.companyName ?? ''}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Primary Color</label>
                    <input
                      name="primaryColor"
                      type="color"
                      defaultValue={settings?.branding?.primaryColor ?? '#3b82f6'}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Secondary Color</label>
                    <input
                      name="secondaryColor"
                      type="color"
                      defaultValue={settings?.branding?.secondaryColor ?? '#8b5cf6'}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Font Family</label>
                    <select
                      name="fontFamily"
                      defaultValue={settings?.branding?.fontFamily ?? 'Inter'}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Lato">Lato</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBrandingForm(false)}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Domain Form Modal */}
        {showDomainForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Custom Domain Settings</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                updateDomain({
                  customDomain: formData.get('customDomain')
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Custom Domain</label>
                    <input
                      name="customDomain"
                      defaultValue={settings?.domain?.customDomain ?? ''}
                      placeholder="app.yourcompany.com"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>You'll need to add DNS records to verify domain ownership.</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDomainForm(false)}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Email Settings Form Modal */}
        {showEmailForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Email Settings</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                updateEmailSettings({
                  fromName: formData.get('fromName'),
                  fromEmail: formData.get('fromEmail'),
                  replyToEmail: formData.get('replyToEmail')
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">From Name</label>
                    <input
                      name="fromName"
                      defaultValue={settings?.emailSettings?.fromName ?? ''}
                      placeholder="Your Company"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">From Email</label>
                    <input
                      name="fromEmail"
                      type="email"
                      defaultValue={settings?.emailSettings?.fromEmail ?? ''}
                      placeholder="noreply@yourcompany.com"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Reply-To Email</label>
                    <input
                      name="replyToEmail"
                      type="email"
                      defaultValue={settings?.emailSettings?.replyToEmail ?? ''}
                      placeholder="support@yourcompany.com"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WhiteLabelSolution;
