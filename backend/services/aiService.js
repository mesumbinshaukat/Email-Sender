import axios from 'axios';
import AIInsight from '../models/AIInsight.js';

class AIService {
  constructor() {
    this.apiKey = process.env.OPEN_ROUTER_API_KEY;
    this.baseURL = 'https://openrouter.ai/api/v1/chat/completions';
    this.model = 'x-ai/grok-2-1212';
  }

  async callAI(messages, userId, insightType, metadata = {}) {
    const startTime = Date.now();

    try {
      const response = await axios.post(
        this.baseURL,
        {
          model: this.model,
          messages,
          temperature: metadata.temperature || 0.7,
          max_tokens: metadata.maxTokens || 1500,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': process.env.BACKEND_URL || 'http://localhost:5000',
            'X-Title': 'Email Tracker AI',
            'Content-Type': 'application/json',
          },
        }
      );

      const processingTime = Date.now() - startTime;
      const aiResponse = response.data.choices[0].message.content;

      // Save insight for learning
      await AIInsight.create({
        userId,
        insightType,
        input: messages[messages.length - 1].content,
        output: aiResponse,
        metadata: {
          model: this.model,
          processingTime,
          tokens: response.data.usage?.total_tokens || 0,
        },
      });

      return aiResponse;
    } catch (error) {
      console.error('AI Service Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get user-specific learning context
  async getUserContext(userId) {
    const recentInsights = await AIInsight.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('insightType output feedback');

    return {
      successfulPatterns: recentInsights.filter(i => i.feedback?.accepted),
      preferences: this.extractPreferences(recentInsights),
    };
  }

  extractPreferences(insights) {
    // Analyze user's past interactions to understand preferences
    const preferences = {
      tone: 'professional',
      length: 'medium',
      style: 'clear',
    };

    // Simple preference extraction (can be enhanced with ML)
    insights.forEach(insight => {
      if (insight.feedback?.rating >= 4) {
        // Learn from highly rated outputs
      }
    });

    return preferences;
  }
}

export default new AIService();
