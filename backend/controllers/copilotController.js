// express-async-handler removed - using native async/await
import OpenAI from 'openai';
import { getEnvVar } from '../utils/envManager.js';

// Initialize OpenAI with dynamic API key
const getOpenAIClient = async () => {
  const apiKey = await getEnvVar('OPENAI_API_KEY');
  return new OpenAI({ apiKey });
};

// @desc    Get writing suggestions
// @route   POST /api/copilot/suggest
// @access  Private
const getSuggestions = async (req, res) => {
  try {
    const { text, context } = req.body;

    const openai = await getOpenAIClient();
    const prompt = `As an email writing assistant, provide suggestions to improve this text: "${text}". Context: ${context || 'General email'}. Provide 3-5 concise suggestions.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200
    });

    const suggestions = completion.choices[0].message.content.split('\n').filter(s => s.trim());
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Check grammar
// @route   POST /api/copilot/check-grammar
// @access  Private
const checkGrammar = async (req, res) => {
  try {
    const { text } = req.body;

    const openai = await getOpenAIClient();
    const prompt = `Check this text for grammar, spelling, and style issues: "${text}". Return corrections and suggestions.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150
    });

    res.json({ feedback: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Analyze tone
// @route   POST /api/copilot/analyze-tone
// @access  Private
const analyzeTone = async (req, res) => {
  try {
    const { text } = req.body;

    const openai = await getOpenAIClient();
    const prompt = `Analyze the tone of this text: "${text}". Rate formality (1-10), friendliness (1-10), persuasiveness (1-10), and suggest improvements.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150
    });

    res.json({ analysis: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get readability score
// @route   GET /api/copilot/readability-score
// @access  Private
const getReadabilityScore = async (req, res) => {
  try {
    const { text } = req.query;

    // Simple readability calculation (Flesch-Kincaid approximation)
    const words = text.split(' ').length;
    const sentences = text.split(/[.!?]+/).length;
    const syllables = text.split(' ').reduce((count, word) => {
      return count + (word.match(/[aeiou]/gi) || []).length;
    }, 0);

    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
    const level = score > 90 ? 'Very Easy' : score > 80 ? 'Easy' : score > 70 ? 'Fairly Easy' : 'Standard';

    res.json({ score: Math.round(score), level });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Improve sentence
// @route   POST /api/copilot/improve-sentence
// @access  Private
const improveSentence = async (req, res) => {
  try {
    const { sentence } = req.body;

    const openai = await getOpenAIClient();
    const prompt = `Improve this sentence for email communication: "${sentence}". Make it more engaging and professional.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100
    });

    res.json({ improved: completion.choices[0].message.content.trim() });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export {
  getSuggestions,
  checkGrammar,
  analyzeTone,
  getReadabilityScore,
  improveSentence
};
