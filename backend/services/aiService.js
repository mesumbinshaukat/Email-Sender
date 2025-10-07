import axios from 'axios';
import AIInsight from '../models/AIInsight.js';

class AIService {
  constructor() {
    this.apiKey = process.env.OPEN_ROUTER_API_KEY;
    this.baseURL = 'https://openrouter.ai/api/v1/chat/completions';
    this.model = 'openai/gpt-oss-20b:free';
  }

  // Check if AI service is available
  isAvailable() {
    return !!this.apiKey && this.apiKey !== 'your_openrouter_api_key_here';
  }

  async callAI(messages, userId, insightType, metadata = {}) {
    // Check if API key is available
    if (!this.isAvailable()) {
      console.warn('AI Service unavailable: OPEN_ROUTER_API_KEY not configured');
      throw new Error('AI service is not configured. Please set OPEN_ROUTER_API_KEY environment variable.');
    }

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

      // If it's an authentication error, provide a clearer message
      if (error.response?.status === 401) {
        throw new Error('AI service authentication failed. Please check your OPEN_ROUTER_API_KEY.');
      }

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

  // Generate personalized talking points for a contact
  async generateTalkingPoints({ contact, context, tone = 'professional' }) {
    const messages = [
      {
        role: 'system',
        content: `You are an expert at generating personalized talking points for business conversations. Generate 3-5 relevant talking points based on the contact's information and the conversation context. Each talking point should include a topic and brief content.`
      },
      {
        role: 'user',
        content: `Generate talking points for a conversation with ${contact.name?.full || contact.email} who works at ${contact.company?.name || 'Unknown Company'} as a ${contact.position?.title || 'Professional'}. 

Context: ${context}
Tone: ${tone}

Contact information:
- Company: ${contact.company?.name || 'N/A'}
- Position: ${contact.position?.title || 'N/A'}
- Industry: ${contact.company?.industry || 'N/A'}
- Location: ${contact.location?.city || 'N/A'}, ${contact.location?.country || 'N/A'}

Please provide talking points as a JSON array with objects containing: topic, content, relevance (0-1), category.`
      }
    ];

    try {
      const response = await this.callAI(messages, contact.userId, 'contact_enrichment', {
        temperature: 0.7,
        maxTokens: 1000,
      });

      // Parse the JSON response
      const talkingPoints = JSON.parse(response);

      // Validate and clean the response
      return talkingPoints.map(point => ({
        topic: point.topic || 'General Topic',
        content: point.content || 'Discussion point',
        relevance: Math.min(Math.max(point.relevance || 0.5, 0), 1),
        category: point.category || 'professional',
      }));
    } catch (error) {
      console.error('Error generating talking points:', error);
      // Fallback talking points
      return [
        {
          topic: 'Industry Trends',
          content: `Discussion about current trends in ${contact.company?.industry || 'your industry'}`,
          relevance: 0.7,
          category: 'professional',
        },
        {
          topic: 'Company Updates',
          content: `Updates on ${contact.company?.name || 'your company'}'s recent developments`,
          relevance: 0.8,
          category: 'company',
        },
        {
          topic: 'Professional Growth',
          content: `Career development and opportunities in ${contact.position?.title || 'your field'}`,
          relevance: 0.6,
          category: 'personal',
        },
      ];
    }
  }
}

export default new AIService();
