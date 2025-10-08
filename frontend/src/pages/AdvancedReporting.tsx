import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { BarChart3, Download, FileText, Calendar, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

interface Report {
  _id: string;
  name: string;
  type: string;
  description?: string;
  config?: any;
  data?: any;
}

interface Dashboard {
  overview: {
    totalEmails: number;
    activeCampaigns: number;
  };
  performance: {
    openRate: number;
    clickRate: number;
  };
}

interface ReportData {
  name: string;
  type: string;
  config: {
    dateRange: {
      preset: string;
    };
  };
}

const AdvancedReporting = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);

  useEffect(() => {
    fetchReports();
    fetchDashboard();
  }, []);

  const fetchReports = async () => {
    try {
      const { data } = await axios.get('/api/reports');
      setReports(data);
    } catch (error) {
      toast.error('Failed to fetch reports');
    }
  };

  const fetchDashboard = async () => {
    try {
      const { data } = await axios.get('/api/reports/dashboard');
      setDashboard(data);
    } catch (error) {
      toast.error('Failed to fetch dashboard');
    }
  };

  const createReport = async (reportData: ReportData) => {
    try {
      const { data } = await axios.post('/api/reports', reportData);
      setReports([data, ...reports]);
      setShowCreateForm(false);
      toast.success('Report created!');
    } catch (error) {
      toast.error('Failed to create report');
    }
  };

  const generateReport = async (reportId: string) => {
    try {
      const { data } = await axios.post(`/api/reports/${reportId}/generate`);
      setSelectedReport(data.report);
      toast.success('Report generated!');
    } catch (error) {
      toast.error('Failed to generate report');
    }
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
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Advanced Reporting
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Custom dashboards and comprehensive analytics
          </p>
        </motion.div>

        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Emails</p>
                  <p className="text-2xl font-bold text-blue-600">{dashboard.overview.totalEmails}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Open Rate</p>
                  <p className="text-2xl font-bold text-green-600">{dashboard.performance.openRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Click Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{dashboard.performance.clickRate}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Campaigns</p>
                  <p className="text-2xl font-bold text-orange-600">{dashboard.overview.activeCampaigns}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Create Custom Report
          </button>
        </div>

        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white rounded-lg shadow p-6 mb-6"
          >
            <h2 className="text-xl font-semibold mb-4">Create Custom Report</h2>
            <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createReport({
                name: formData.get('name') as string,
                type: formData.get('type') as string,
                config: {
                  dateRange: { preset: 'last_30_days' }
                }
              });
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Report Name</label>
                  <input
                    name="name"
                    placeholder="Monthly Performance Report"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Report Type</label>
                  <select
                    name="type"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="email_performance">Email Performance</option>
                    <option value="campaign_analysis">Campaign Analysis</option>
                    <option value="contact_segmentation">Contact Segmentation</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                  Create Report
                </button>
                <button type="button" onClick={() => setShowCreateForm(false)} className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map(report => (
            <motion.div
              key={report._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{report.name}</h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize">
                  {report.type.replace('_', ' ')}
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {report.description || 'Custom report configuration'}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => generateReport(report._id)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-sm"
                >
                  Generate
                </button>
                <button
                  onClick={() => setSelectedReport(report)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 text-sm"
                >
                  View
                </button>
              </div>
            </motion.div>
          ))}
        </div>
    </div>
      </DashboardLayout>
  );
};

export default AdvancedReporting;
