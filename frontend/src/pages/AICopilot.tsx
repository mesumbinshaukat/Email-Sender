import { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Bot, Lightbulb, CheckCircle, BarChart3, Wand2 } from 'lucide-react';
import { AINotConfiguredModal } from '../components/AINotConfiguredModal';
import { useAIProvider } from '../hooks/useAIProvider';

const AICopilot = () => {
  const { handleAIError, showConfigModal, setShowConfigModal } = useAIProvider();
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [grammarFeedback, setGrammarFeedback] = useState('');
  const [toneAnalysis, setToneAnalysis] = useState('');
  const [readabilityScore, setReadabilityScore] = useState<{ score: number; level: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const getSuggestions = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/copilot/suggest', {
        text,
        context: 'email writing'
      });
      setSuggestions(data.suggestions);
    } catch (error) {
      if (!handleAIError(error, 'AI Copilot')) {
        toast.error('Failed to get suggestions');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkGrammar = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/copilot/check-grammar', { text });
      setGrammarFeedback(data.feedback);
    } catch (error) {
      if (!handleAIError(error, 'AI Copilot')) {
        toast.error('Failed to check grammar');
      }
    } finally {
      setLoading(false);
    }
  };

  const analyzeTone = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/copilot/analyze-tone', { text });
      setToneAnalysis(data.analysis);
    } catch (error) {
      if (!handleAIError(error, 'AI Copilot')) {
        toast.error('Failed to analyze tone');
      }
    } finally {
      setLoading(false);
    }
  };

  const getReadability = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text');
      return;
    }

    try {
      const { data } = await axios.get('/api/copilot/readability-score', {
        params: { text }
      });
      setReadabilityScore(data);
    } catch (error) {
      toast.error('Failed to get readability score');
    }
  };

  const improveSentence = async (sentence: string) => {
    try {
      const { data } = await axios.post('/api/copilot/improve-sentence', { sentence });
      toast.success(`Improved: ${data.improved}`);
    } catch (error) {
      toast.error('Failed to improve sentence');
    }
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
            <Bot className="h-8 w-8 text-blue-600" />
            AI Email Assistant (Copilot)
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Get real-time writing suggestions, grammar checks, and tone analysis
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Your Text</h2>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your email content here for AI analysis..."
                className="w-full h-64 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 resize-none"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">AI Analysis Tools</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={getSuggestions}
                  disabled={loading}
                  className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Lightbulb className="h-4 w-4" />
                  Get Suggestions
                </button>
                <button
                  onClick={checkGrammar}
                  disabled={loading}
                  className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Check Grammar
                </button>
                <button
                  onClick={analyzeTone}
                  disabled={loading}
                  className="bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Analyze Tone
                </button>
                <button
                  onClick={getReadability}
                  disabled={loading}
                  className="bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Readability
                </button>
              </div>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  Writing Suggestions
                </h3>
                <ul className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span className="text-sm">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Grammar Feedback */}
            {grammarFeedback && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Grammar & Style Feedback
                </h3>
                <p className="text-sm">{grammarFeedback}</p>
              </div>
            )}

            {/* Tone Analysis */}
            {toneAnalysis && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Tone Analysis
                </h3>
                <p className="text-sm">{toneAnalysis}</p>
              </div>
            )}

            {/* Readability Score */}
            {readabilityScore && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-orange-600" />
                  Readability Score
                </h3>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-orange-600">
                    {readabilityScore.score}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{readabilityScore.level}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Higher scores = easier to read
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!suggestions.length && !grammarFeedback && !toneAnalysis && !readabilityScore && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  AI Assistant Ready
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter your text and use the analysis tools to get AI-powered feedback
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* AI Not Configured Modal */}
      <AINotConfiguredModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        feature="AI Copilot"
      />
    </div>
  );
};

export default AICopilot;
