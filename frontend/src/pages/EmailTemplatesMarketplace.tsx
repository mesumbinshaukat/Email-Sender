import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Download, Upload, DollarSign } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

interface Template {
  _id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  downloads: number;
  description?: string;
}

const EmailTemplatesMarketplace = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data } = await axios.get('/api/gamification/templates');
      setTemplates(data);
    } catch (error) {
      toast.error('Failed to fetch templates');
    }
  };

  const purchaseTemplate = async (templateId: string) => {
    try {
      await axios.post(`/api/gamification/templates/${templateId}/purchase`);
      toast.success('Template purchased successfully!');
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to purchase template');
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            Email Templates Marketplace
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Buy and sell professional email templates
          </p>
        </motion.div>

        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
          />
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Sell Template
          </button>
        </div>

        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6"
          >
            <h2 className="text-xl font-semibold mb-4">Create Template Listing</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              // Handle template creation
              toast.success('Template creation coming soon!');
              setShowCreateForm(false);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input name="name" placeholder="Template Name" className="p-3 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                <select name="category" className="p-3 border rounded dark:bg-gray-700 dark:border-gray-600">
                  <option value="welcome">Welcome</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="promotional">Promotional</option>
                </select>
                <input name="price" type="number" placeholder="Price ($)" className="p-3 border rounded dark:bg-gray-700 dark:border-gray-600" />
                <textarea name="description" placeholder="Description" className="p-3 border rounded dark:bg-gray-700 dark:border-gray-600 md:col-span-2" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                  List Template
                </button>
                <button type="button" onClick={() => setShowCreateForm(false)} className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <motion.div
              key={template._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
            >
              <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <ShoppingCart className="h-16 w-16 text-gray-400" />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{template.name}</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize">
                    {template.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {template.description}
                </p>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">{template.rating || 0}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ({template.downloads || 0} downloads)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-semibold">{template.price || 'Free'}</span>
                  </div>
                </div>
                <button
                  onClick={() => purchaseTemplate(template._id)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {template.price ? `Purchase ($${template.price})` : 'Download Free'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
    </div>
      </DashboardLayout>
  );
};

export default EmailTemplatesMarketplace;
