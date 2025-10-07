import { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Zap, Send, Eye } from 'lucide-react';

const AMPBuilder = () => {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [interactiveElements, setInteractiveElements] = useState<string[]>([]);
  const [generatedAMP, setGeneratedAMP] = useState('');
  const [loading, setLoading] = useState(false);

  const availableElements = ['form', 'poll', 'calendar', 'carousel', 'lightbox'];

  const toggleElement = (element: string) => {
    setInteractiveElements(prev =>
      prev.includes(element)
        ? prev.filter(e => e !== element)
        : [...prev, element]
    );
  };

  const generateAMP = async () => {
    if (!subject || !content) {
      toast.error('Please fill in subject and content');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/amp/generate', {
        subject,
        content,
        interactiveElements
      });
      setGeneratedAMP(data.ampHtml);
      toast.success('AMP email generated successfully');
    } catch (error) {
      toast.error('Failed to generate AMP email');
    } finally {
      setLoading(false);
    }
  };

  const previewEmail = () => {
    if (!generatedAMP) return;
    const newWindow = window.open('', '_blank');
    newWindow?.document.write(generatedAMP);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Zap className="h-8 w-8 text-blue-600" />
            Interactive AMP Email Builder
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create AMP-powered emails with interactive elements for real-time engagement
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Email Content</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Subject Line</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Enter email subject"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email Content</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Enter email content (AI will enhance with AMP)"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Interactive Elements</h2>
              <div className="grid grid-cols-2 gap-3">
                {availableElements.map(element => (
                  <button
                    key={element}
                    onClick={() => toggleElement(element)}
                    className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                      interactiveElements.includes(element)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {element.charAt(0).toUpperCase() + element.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generateAMP}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Generating...' : 'Generate AMP Email'}
              <Zap className="h-4 w-4" />
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Generated AMP</h2>
              {generatedAMP && (
                <div className="flex gap-2">
                  <button
                    onClick={previewEmail}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </button>
                  <button className="text-green-600 hover:text-green-700 flex items-center gap-1">
                    <Send className="h-4 w-4" />
                    Send
                  </button>
                </div>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 min-h-[400px]">
              {generatedAMP ? (
                <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-auto max-h-[400px]">
                  {generatedAMP}
                </pre>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Generated AMP HTML will appear here
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AMPBuilder;
