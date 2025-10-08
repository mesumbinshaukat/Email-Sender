import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Brain, Sparkles, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AINotConfiguredModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export const AINotConfiguredModal: React.FC<AINotConfiguredModalProps> = ({
  isOpen,
  onClose,
  feature = 'this feature'
}) => {
  const navigate = useNavigate();

  const handleConfigure = () => {
    navigate('/ai-providers');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Brain className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">AI Provider Required</h3>
                  <p className="text-white/80 text-sm">Configuration needed</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">No AI Provider Configured</p>
                  <p>
                    To use {feature}, you need to configure an AI provider first. This enables
                    AI-powered features across the platform.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  Available Providers:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    { name: 'OpenRouter', icon: '🌐', desc: '100+ models' },
                    { name: 'OpenAI', icon: '🤖', desc: 'GPT-4' },
                    { name: 'Gemini', icon: '✨', desc: 'Google AI' },
                    { name: 'Grok', icon: '⚡', desc: 'X.AI' }
                  ].map((provider) => (
                    <div
                      key={provider.name}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{provider.icon}</span>
                        <span className="font-medium text-gray-900">{provider.name}</span>
                      </div>
                      <p className="text-xs text-gray-600">{provider.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-900">
                  <span className="font-semibold">Recommended:</span> Start with OpenRouter for
                  access to 100+ AI models including GPT-4, Claude, Gemini, and more.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium"
              >
                Maybe Later
              </button>
              <button
                onClick={handleConfigure}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                Configure Now
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
