// express-async-handler removed - using native async/await
import OpenAI from 'openai';
import { getEnvVar } from '../utils/envManager.js';

// Initialize OpenAI with dynamic API key
const getOpenAIClient = async () => {
  const apiKey = await getEnvVar('OPENAI_API_KEY');
  return new OpenAI({ apiKey });
};

// @desc    Suggest emojis
// @route   POST /api/emoji/suggest
// @access  Private
const suggestEmojis = async (req, res) => {
  try {
  const { subject, content } = req.body;

  const prompt = `Suggest 5-7 relevant emojis for this email subject and content. Consider the tone, topic, and cultural appropriateness.

Subject: "${subject}"
Content: "${content?.substring(0, 200)}..."

Return only emojis separated by spaces, no explanation.`;

  const openai = await getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 50
  });

  const emojis = completion.choices[0].message.content.trim().split(' ');
  res.json({ emojis });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Check appropriateness
// @route   POST /api/emoji/check-appropriateness
// @access  Private
const checkAppropriateness = async (req, res) => {
  try {
  const { emojis, context } = req.body;

  const prompt = `Check if these emojis are culturally appropriate for this context: "${context}". Emojis: ${emojis.join(' ')}

Return JSON: {"appropriate": true/false, "reason": "explanation"}`;

  const openai = await getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 100
  });

  const result = JSON.parse(completion.choices[0].message.content);
  res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get trending emojis
// @route   GET /api/emoji/trending
// @access  Private
const getTrendingEmojis = async (req, res) => {
  try {
  // Simplified: return static trending emojis
  const trending = ['🚀', '📈', '🎯', '💡', '🔥', '⭐', '🎉', '💪', '🌟', '📊'];
  res.json({ trending });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get emoji performance analytics
// @route   GET /api/emoji/performance-analytics
// @access  Private
const getEmojiPerformance = async (req, res) => {
  try {
  // Placeholder analytics
  res.json({
    topPerforming: ['🚀', '💡', '🎯'],
    performance: {
      '🚀': { opens: 85, clicks: 12 },
      '💡': { opens: 78, clicks: 15 },
      '🎯': { opens: 82, clicks: 10 }
    }
  });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    A/B test emojis
// @route   POST /api/emoji/ab-test
// @access  Private
const abTestEmojis = async (req, res) => {
  try {
  const { subject, emojiSets } = req.body;

  // Simplified: return test setup
  res.json({
    testId: `emoji-test-${Date.now()}`,
    variants: emojiSets.map((set, index) => ({
      id: `variant-${index}`,
      emojis: set,
      subject: `${subject} ${set.join('')}`
    }))
  });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export {
  suggestEmojis,
  checkAppropriateness,
  getTrendingEmojis,
  getEmojiPerformance,
  abTestEmojis
};
