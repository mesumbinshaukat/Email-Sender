import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Brain, Zap, TrendingUp, Target, Play, Pause } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

interface AIModel {
  _id: string;
  modelType: string;
  status: string;
  performance?: {
    accuracy: number;
  };
}

const AITraining = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const { data } = await axios.get('/api/ai-training');
      setModels(data);
    } catch (error) {
      toast.error('Failed to fetch AI models');
    }
  };

  const startTraining = async (modelType: string) => {
    try {
      const { data } = await axios.post('/api/ai-training/train', { modelType });
      toast.success('AI training started!');
      fetchModels();
    } catch (error) {
      toast.error('Failed to start training');
    }
  };

  const useModel = async (modelId: string, input: string) => {
    try {
      const { data } = await axios.post(`/api/ai-training/${modelId}/predict`, { input });
      toast.success('AI prediction completed!');
      console.log(data);
    } catch (error) {
      toast.error('Failed to use model');
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
            <Brain className="h-8 w-8 text-blue-600" />
            AI Training
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Train custom AI models on your email data
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { type: 'content_generator', name: 'Content Generator', icon: Zap },
            { type: 'subject_optimizer', name: 'Subject Optimizer', icon: Target },
            { type: 'send_time_predictor', name: 'Send Time Predictor', icon: TrendingUp },
            { type: 'audience_segmenter', name: 'Audience Segmenter', icon: Brain }
          ].map(model => (
            <motion.div
              key={model.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow p-6 text-center"
            >
              <model.icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">{model.name}</h3>
              <button
                onClick={() => startTraining(model.type)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Train Model
              </button>
            </motion.div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Your AI Models</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {models.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                No AI models trained yet. Start training your first model above!
              </div>
            ) : (
              models.map(model => (
                <div key={model._id} className="px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold capitalize">{model.modelType.replace('_', ' ')}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Status: {model.status} | Accuracy: {model.performance?.accuracy || 0}%
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {model.status === 'ready' && (
                        <button
                          onClick={() => useModel(model._id, 'test input')}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                        >
                          Test Model
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedModel(model)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AITraining;
