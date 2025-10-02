import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Server, Save, TestTube, Trash2 } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  isConfigured: boolean;
}

export const Settings: React.FC = () => {
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    host: '',
    port: 587,
    secure: false,
    user: '',
    isConfigured: false,
  });
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchSmtpConfig();
  }, []);

  const fetchSmtpConfig = async () => {
    try {
      const response = await axios.get('/smtp');
      
      if (response.data.success) {
        setSmtpConfig(response.data.data);
      }
    } catch (error: any) {
      toast.error('Failed to fetch SMTP configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!smtpConfig.host || !smtpConfig.user || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      const response = await axios.put('/smtp', {
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        user: smtpConfig.user,
        password: password,
      });

      if (response.data.success) {
        toast.success('SMTP configuration saved successfully');
        setSmtpConfig(response.data.data);
        setPassword('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save SMTP configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!smtpConfig.host || !smtpConfig.user || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setTesting(true);

    try {
      const response = await axios.post('/smtp/test', {
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        user: smtpConfig.user,
        password: password,
      });

      if (response.data.success) {
        toast.success('SMTP configuration is valid!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'SMTP configuration test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your SMTP configuration?')) return;

    try {
      const response = await axios.delete('/smtp');
      
      if (response.data.success) {
        toast.success('SMTP configuration deleted');
        setSmtpConfig({
          host: '',
          port: 587,
          secure: false,
          user: '',
          isConfigured: false,
        });
        setPassword('');
      }
    } catch (error: any) {
      toast.error('Failed to delete SMTP configuration');
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
        className="max-w-3xl mx-auto space-y-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Configure your SMTP settings for sending emails</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Server className="h-6 w-6 text-primary-600" />
                <span>SMTP Configuration</span>
              </CardTitle>
              {smtpConfig.isConfigured && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  Configured
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📧 SMTP Setup Guide</h4>
                <p className="text-sm text-blue-800">
                  Enter your email provider's SMTP details. Common providers:
                </p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4">
                  <li>• <strong>Gmail:</strong> smtp.gmail.com, Port 587</li>
                  <li>• <strong>Outlook:</strong> smtp-mail.outlook.com, Port 587</li>
                  <li>• <strong>Yahoo:</strong> smtp.mail.yahoo.com, Port 587</li>
                </ul>
              </div>

              <Input
                label="SMTP Host"
                placeholder="smtp.gmail.com"
                value={smtpConfig.host}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Port"
                  type="number"
                  placeholder="587"
                  value={smtpConfig.port}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value) })}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secure Connection
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={smtpConfig.secure ? 'true' : 'false'}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, secure: e.target.value === 'true' })}
                  >
                    <option value="false">No (TLS/STARTTLS)</option>
                    <option value="true">Yes (SSL/TLS)</option>
                  </select>
                </div>
              </div>

              <Input
                label="Email / Username"
                type="email"
                placeholder="your-email@example.com"
                value={smtpConfig.user}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                required
              />

              <Input
                label="Password / App Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!smtpConfig.isConfigured}
              />

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Security Note:</strong> For Gmail, you may need to use an App Password instead of your regular password. 
                  Enable 2-factor authentication and generate an app password in your Google Account settings.
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <Button type="submit" isLoading={saving}>
                  <Save className="h-5 w-5 mr-2" />
                  Save Configuration
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTest}
                  isLoading={testing}
                >
                  <TestTube className="h-5 w-5 mr-2" />
                  Test Connection
                </Button>

                {smtpConfig.isConfigured && (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-5 w-5 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};
