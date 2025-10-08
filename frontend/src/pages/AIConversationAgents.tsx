import { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MessageSquare, Send } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

const AIConversationAgents = () => {
  const [replyContent, setReplyContent] = useState('');
  const [sentiment, setSentiment] = useState('neutral');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const generateResponse = async () => {
    if (!replyContent) {
      toast.error('Please enter reply content');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/conversation-agents/respond', {
        replyContent,
        sentiment
      });
      setAiResponse(data.response);
      toast.success('AI response generated');
    } catch (error) {
      toast.error('Failed to generate response');
    } finally {
      setLoading(false);
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
            <MessageSquare className="h-8 w-8 text-blue-600" />
            AI Conversation Agents
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Autonomous agents analyze replies and generate context-aware responses
          </p>
        </motion.div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Analyze Customer Reply</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Customer Reply</label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={4}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Paste customer reply here..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sentiment</label>
                <select
                  value={sentiment}
                  onChange={(e) => setSentiment(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                </select>
              </div>
              <button
                onClick={generateResponse}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? 'Generating...' : 'Generate Response'}
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          {aiResponse && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">AI Generated Response</h2>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{aiResponse}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIConversationAgents;
