import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Plus, Check, X, Loader2, Sparkles, Brain, Zap, AlertCircle, Eye, EyeOff, TestTube } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

interface AIProvider {
  _id: string;
  provider: string;
  isDefault: boolean;
  isActive: boolean;
  config: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  apiKeyPreview: string;
  usage?: {
    totalRequests: number;
    totalTokens: number;
  };
}

interface Model {
  id: string;
  name: string;
  provider?: string;
}

const providerInfo = {
  openrouter: {
    name: 'OpenRouter',
    description: 'Access 100+ AI models including GPT-4, Claude, Gemini, Llama',
    icon: '🌐',
    color: 'from-purple-500 to-pink-500',
    recommended: true
  },
  openai: {
    name: 'OpenAI',
    description: 'Direct access to GPT-4 and GPT-3.5-Turbo',
    icon: '🤖',
    color: 'from-green-500 to-emerald-500',
    recommended: false
  },
  gemini: {
    name: 'Google Gemini',
    description: 'Gemini Pro and Gemini Pro Vision',
    icon: '✨',
    color: 'from-blue-500 to-cyan-500',
    recommended: false
  },
  grok: {
    name: 'Grok (X.AI)',
    description: 'Latest AI from X.AI',
    icon: '⚡',
    color: 'from-yellow-500 to-orange-500',
    recommended: false
  },
  anthropic: {
    name: 'Anthropic Claude',
    description: 'Claude 3 (Opus, Sonnet, Haiku)',
    icon: '🧠',
    color: 'from-indigo-500 to-purple-500',
    recommended: false
  }
};

export default function AIProviderSettings() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    if (selectedProvider) {
      fetchModels(selectedProvider);
    }
  }, [selectedProvider]);

  const fetchProviders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/ai-providers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProviders(response.data.data);
    } catch (error: any) {
      toast.error('Failed to fetch AI providers');
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async (provider: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/ai-providers/models/${provider}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAvailableModels(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedModel(response.data.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch models');
    }
  };

  const testAPIKey = async () => {
    if (!apiKey) {
      toast.error('Please enter an API key');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/ai-providers/test`,
        {
          provider: selectedProvider,
          apiKey,
          model: selectedModel
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTestResult({
        success: true,
        message: response.data.message
      });
      toast.success('API key is valid!');
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.response?.data?.message || 'Invalid API key'
      });
      toast.error('Invalid API key');
    } finally {
      setTesting(false);
    }
  };

  const addProvider = async () => {
    if (!apiKey) {
      toast.error('Please enter an API key');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/ai-providers`,
        {
          provider: selectedProvider,
          apiKey,
          isDefault: providers.length === 0,
          config: {
            model: selectedModel,
            temperature: 0.7,
            maxTokens: 1500
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('AI provider added successfully!');
      setShowAddModal(false);
      setApiKey('');
      setTestResult(null);
      fetchProviders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add provider');
    } finally {
      setSaving(false);
    }
  };

  const setDefaultProvider = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/ai-providers/${id}/set-default`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Default provider updated');
      fetchProviders();
    } catch (error) {
      toast.error('Failed to update default provider');
    }
  };

  const toggleProvider = async (id: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/ai-providers/${id}`,
        { isActive: !isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Provider ${!isActive ? 'enabled' : 'disabled'}`);
      fetchProviders();
    } catch (error) {
      toast.error('Failed to update provider');
    }
  };

  const deleteProvider = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/ai-providers/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Provider deleted');
      fetchProviders();
    } catch (error) {
      toast.error('Failed to delete provider');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Brain className="h-8 w-8 text-purple-600" />
              AI Provider Settings
            </h1>
            <p className="text-gray-600 mt-2">
              Configure AI providers to power your email campaigns and features
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            Add Provider
          </button>
        </div>

        {/* Providers Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300">
            <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No AI Providers Configured</h3>
            <p className="text-gray-600 mb-6">
              Add your first AI provider to start using AI-powered features
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              <Plus className="h-5 w-5" />
              Add Provider
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {providers.map((provider) => {
              const info = providerInfo[provider.provider as keyof typeof providerInfo] || {
                name: provider.provider,
                description: 'Custom provider',
                icon: '🤖',
                color: 'from-gray-400 to-gray-500',
                recommended: false,
              };
              return (
                <motion.div
                  key={provider._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className={`h-2 bg-gradient-to-r ${info.color}`} />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{info.icon}</div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            {info.name}
                            {provider.isDefault && (
                              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">
                                Default
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600">{info.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleProvider(provider._id, provider.isActive)}
                          className={`p-2 rounded-lg transition-colors ${
                            provider.isActive
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                          title={provider.isActive ? 'Disable' : 'Enable'}
                        >
                          {provider.isActive ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Model:</span>
                        <span className="font-medium text-gray-900">{provider.config.model}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">API Key:</span>
                        <span className="font-mono text-gray-900">{provider.apiKeyPreview}</span>
                      </div>
                      {provider.usage && (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Requests:</span>
                            <span className="font-medium text-gray-900">
                              {provider.usage.totalRequests.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Tokens Used:</span>
                            <span className="font-medium text-gray-900">
                              {provider.usage.totalTokens.toLocaleString()}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-6 flex gap-2">
                      {!provider.isDefault && (
                        <button
                          onClick={() => setDefaultProvider(provider._id)}
                          className="flex-1 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium text-sm"
                        >
                          Set as Default
                        </button>
                      )}
                      <button
                        onClick={() => deleteProvider(provider._id)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Add Provider Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                    Add AI Provider
                  </h2>
                  <p className="text-gray-600 mt-1">Configure a new AI provider for your account</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Provider Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Provider
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(providerInfo).map(([key, info]) => (
                        <button
                          key={key}
                          onClick={() => setSelectedProvider(key)}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            selectedProvider === key
                              ? `border-purple-500 bg-gradient-to-br ${info.color} bg-opacity-10`
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{info.icon}</span>
                            <div>
                              <div className="font-semibold text-gray-900 flex items-center gap-2">
                                {info.name}
                                {info.recommended && (
                                  <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                                    Recommended
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">{info.description}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* API Key Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Model Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model
                    </label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {availableModels.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name} {model.provider && `(${model.provider})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Test Button */}
                  <button
                    onClick={testAPIKey}
                    disabled={testing || !apiKey}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {testing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-5 w-5" />
                        Test API Key
                      </>
                    )}
                  </button>

                  {/* Test Result */}
                  {testResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg flex items-start gap-3 ${
                        testResult.success
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      {testResult.success ? (
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className={`font-medium ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                          {testResult.message}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="p-6 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addProvider}
                    disabled={saving || !apiKey || !testResult?.success}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5" />
                        Add Provider
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
