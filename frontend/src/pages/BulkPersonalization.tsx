import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from '../lib/axios';
import { motion } from 'framer-motion';
import { Upload, Send, Eye, FileText, Users, CheckCircle } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

interface BulkJob {
  _id: string;
  name: string;
  totalContacts: number;
  processedContacts: number;
  sentEmails: number;
  status: string;
  createdAt: string;
}

interface Template {
  _id: string;
  name: string;
  variables: Array<{ name: string; type: string }>;
}

const BulkPersonalization = () => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState('');
  const [jobName, setJobName] = useState('');
  const [bulkJobs, setBulkJobs] = useState<BulkJob[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [personalizationRules, setPersonalizationRules] = useState<Array<{ field: string; value: string; aiGenerated: boolean }>>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchBulkJobs();
    fetchTemplates();
  }, []);

  const fetchBulkJobs = async () => {
    try {
      const { data } = await axios.get('/api/bulk/jobs');
      const payload = (data?.data ?? data) as any;
      setBulkJobs(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setBulkJobs([]);
      toast.error('Failed to fetch bulk jobs');
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data } = await axios.get('/api/design/templates');
      const payload = (data?.data ?? data) as any;
      setTemplates(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setTemplates([]);
      toast.error('Failed to fetch templates');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvContent(content);
      };
      reader.readAsText(file);
    }
  };

  const uploadCSV = async () => {
    if (!csvContent || !jobName) {
      toast.error('Please select a CSV file and enter job name');
      return;
    }

    setUploading(true);
    try {
      const { data } = await axios.post('/api/bulk/upload-csv', {
        csvContent,
        name: jobName
      });
      const created = (data?.data ?? data) as any;
      setBulkJobs([created, ...bulkJobs]);
      toast.success('CSV uploaded successfully!');
      setCsvFile(null);
      setCsvContent('');
      setJobName('');
    } catch (error) {
      toast.error('Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  const personalizeBulk = async () => {
    if (!selectedTemplate || personalizationRules.length === 0) {
      toast.error('Please select template and add personalization rules');
      return;
    }

    try {
      const { data } = await axios.post('/api/bulk/personalize', {
        bulkJobId: bulkJobs[0]._id, // Use latest job
        templateId: selectedTemplate,
        personalizationRules
      });
      toast.success('Personalization completed!');
    } catch (error) {
      toast.error('Failed to personalize');
    }
  };

  const sendBulkEmails = async () => {
    try {
      const { data } = await axios.post('/api/bulk/send', {
        bulkJobId: bulkJobs[0]._id
      });
      toast.success('Bulk send initiated!');
      fetchBulkJobs(); // Refresh status
    } catch (error) {
      toast.error('Failed to send bulk emails');
    }
  };

  const addPersonalizationRule = () => {
    setPersonalizationRules([...personalizationRules, { field: '', value: '', aiGenerated: false }]);
  };

  const updateRule = (index: number, field: string, value: any) => {
    const updated = [...personalizationRules];
    updated[index] = { ...updated[index], [field]: value };
    setPersonalizationRules(updated);
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
            <Users className="h-8 w-8 text-blue-600" />
            Bulk Personalization
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Upload CSV contacts and send personalized emails at scale
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload & Configure */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* CSV Upload */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload CSV
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Job Name</label>
                  <input
                    type="text"
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                    placeholder="My Bulk Email Campaign"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">CSV File</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={uploadCSV}
                  disabled={uploading || !csvContent}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                  Upload & Process
                </button>
              </div>
            </div>

            {/* Personalization Setup */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Personalization Setup
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email Template</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select template</option>
                    {(Array.isArray(templates) ? templates : []).map(template => (
                      <option key={template._id} value={template._id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-4">Personalization Rules</label>
                  {personalizationRules.map((rule, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Field name"
                        value={rule.field}
                        onChange={(e) => updateRule(index, 'field', e.target.value)}
                        className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Value or merge field"
                        value={rule.value}
                        onChange={(e) => updateRule(index, 'value', e.target.value)}
                        className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={rule.aiGenerated}
                          onChange={(e) => updateRule(index, 'aiGenerated', e.target.checked)}
                        />
                        AI
                      </label>
                    </div>
                  ))}
                  <button
                    onClick={addPersonalizationRule}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    + Add Rule
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={personalizeBulk}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                  >
                    Personalize
                  </button>
                  <button
                    onClick={sendBulkEmails}
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Send Bulk
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Jobs & Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Bulk Jobs */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Bulk Jobs
              </h2>

              {bulkJobs.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No bulk jobs yet. Upload a CSV to get started!
                </p>
              ) : (
                <div className="space-y-3">
                  {bulkJobs.map(job => (
                    <div
                      key={job._id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{job.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {job.processedContacts}/{job.totalContacts} processed
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${
                          job.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            : job.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                            : 'bg-gray-100 text-gray-800 dark:text-gray-100'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button className="text-blue-600 hover:text-blue-700 text-sm">
                          <Eye className="h-4 w-4 inline mr-1" />
                          Preview
                        </button>
                        <button className="text-green-600 hover:text-green-700 text-sm">
                          <CheckCircle className="h-4 w-4 inline mr-1" />
                          Status
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Email Preview
              </h2>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Select a contact to preview personalized email
              </div>
            </div>
          </motion.div>
        </div>
    </div>
      </DashboardLayout>
  );
};

export default BulkPersonalization;
