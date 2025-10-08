import { useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface AIProviderHook {
  checkAIConfigured: () => Promise<boolean>;
  handleAIError: (error: any, featureName?: string) => boolean;
  showConfigModal: boolean;
  setShowConfigModal: (show: boolean) => void;
}

export const useAIProvider = (): AIProviderHook => {
  const [showConfigModal, setShowConfigModal] = useState(false);

  const checkAIConfigured = useCallback(async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/ai-providers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data && response.data.data.length > 0;
    } catch (error) {
      return false;
    }
  }, []);

  const handleAIError = useCallback((error: any, featureName?: string): boolean => {
    if (
      error.response?.data?.code === 'AI_NOT_CONFIGURED' ||
      error.response?.data?.code === 'OPENAI_NOT_CONFIGURED' ||
      error.message?.includes('AI provider not configured') ||
      error.message?.includes('OpenAI API key not configured')
    ) {
      setShowConfigModal(true);
      toast.error(
        featureName
          ? `Please configure an AI provider to use ${featureName}`
          : 'Please configure an AI provider to continue'
      );
      return true;
    }
    return false;
  }, []);

  return {
    checkAIConfigured,
    handleAIError,
    showConfigModal,
    setShowConfigModal
  };
};
