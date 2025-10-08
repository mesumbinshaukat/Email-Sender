import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Palette, Wand2, Eye, Save, FileText } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

interface Template {
  _id: string;
  name: string;
  description: string;
  html: string;
  variables: Array<{ name: string; type: string; defaultValue: string }>;
}

interface BrandKit {
  _id: string;
  name: string;
  colors: { primary: string; secondary: string; accent: string };
  fonts: { heading: { family: string; weight: string }; body: { family: string; weight: string } };
}

const EmailDesigner = () => {
  const [description, setDescription] = useState('');
  const [brandKitId, setBrandKitId] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  useEffect(() => {
    fetchTemplates();
    fetchBrandKits();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data } = await axios.get('/api/design/templates');
      setTemplates(data);
    } catch (error) {
      toast.error('Failed to fetch templates');
    }
  };

  const fetchBrandKits = async () => {
    try {
      const { data } = await axios.get('/api/design/brand-kits');
      setBrandKits(data);
    } catch (error) {
      toast.error('Failed to fetch brand kits');
    }
  };

  const generateTemplate = async () => {
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/design/generate-template', {
        description,
        brandKitId: brandKitId || undefined
      });
      setTemplates([data, ...templates]);
      toast.success('Template generated successfully!');
      setDescription('');
    } catch (error) {
      toast.error('Failed to generate template');
    } finally {
      setLoading(false);
    }
  };

  const previewTemplateFunc = async (templateId: string) => {
    try {
      const { data } = await axios.get(`/api/design/preview/${templateId}`);
      const template = templates.find(t => t._id === templateId);
      if (template) {
        setPreviewTemplate({ ...template, html: data.html });
      }
    } catch (error) {
      toast.error('Failed to load preview');
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
            <Palette className="h-8 w-8 text-blue-600" />
            AI Email Designer
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Generate beautiful, responsive email templates with AI
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Generator Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Generate Template
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Template Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your email template (e.g., 'Newsletter about our new product launch with hero image and CTA')"
                    className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Brand Kit (Optional)
                  </label>
                  <select
                    value={brandKitId}
                    onChange={(e) => setBrandKitId(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="">Use default</option>
                    {brandKits.map(kit => (
                      <option key={kit._id} value={kit._id}>{kit.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={generateTemplate}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Wand2 className="h-5 w-5" />
                  )}
                  Generate Template
                </button>
              </div>
            </div>
          </motion.div>

          {/* Templates List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Your Templates
              </h2>

              {templates.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No templates yet. Generate your first one!
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(template => (
                    <div
                      key={template._id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <h3 className="font-semibold mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {template.description}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => previewTemplateFunc(template._id)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                        </button>
                        <button
                          onClick={() => toast.success('Edit functionality coming soon!')}
                          className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm"
                        >
                          <Save className="h-4 w-4" />
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Preview Modal */}
        {previewTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">{previewTemplate.name}</h3>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 overflow-auto max-h-[60vh]">
                <iframe
                  srcDoc={previewTemplate.html}
                  className="w-full h-96 border rounded"
                  title="Email Preview"
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmailDesigner;
