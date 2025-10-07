import { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Code, Wand2 } from 'lucide-react';

const LiquidPersonalization = () => {
  const [template, setTemplate] = useState('');
  const [recipientData, setRecipientData] = useState('');
  const [personalizedContent, setPersonalizedContent] = useState('');
  const [loading, setLoading] = useState(false);

  const personalize = async () => {
    if (!template || !recipientData) {
      toast.error('Please fill in template and data');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/liquid/personalize', {
        template,
        recipientData: JSON.parse(recipientData)
      });
      setPersonalizedContent(data.personalizedContent);
      toast.success('Content personalized');
    } catch (error) {
      toast.error('Failed to personalize');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Code className="h-8 w-8 text-blue-600" />
            Liquid Dynamic Personalization
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Advanced templating with Liquid syntax for hyper-variable content
          </p>
        </motion.div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Apply Liquid Personalization</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Liquid Template</label>
                <textarea
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  rows={6}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 font-mono text-sm"
                  placeholder="Hello {{firstName}}, your {{product}} is ready!"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Recipient Data (JSON)</label>
                <textarea
                  value={recipientData}
                  onChange={(e) => setRecipientData(e.target.value)}
                  rows={4}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 font-mono text-sm"
                  placeholder='{"firstName": "John", "product": "iPhone"}'
                />
              </div>
              <button
                onClick={personalize}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? 'Personalizing...' : 'Personalize Content'}
                <Wand2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {personalizedContent && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Personalized Output</h2>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <pre className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{personalizedContent}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiquidPersonalization;
