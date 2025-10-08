import { getAIClient } from '../utils/openaiHelper.js';

export const generateResponse = async (req, res) => {
  try {
    const { replyContent, sentiment } = req.body;

    const aiClient = await getAIClient(req.user?._id);

    const prompt = `Analyze this customer reply: "${replyContent}". Sentiment: ${sentiment}. Generate a context-aware response. If complex, suggest escalation.`;

    const completion = await aiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const response = completion.choices[0].message.content;
    res.json({ response, escalate: response.includes('escalate') });
  } catch (error) {
    if (error.message.includes('API key not configured') || error.message.includes('No AI provider')) {
      return res.status(400).json({
        success: false,
        message: 'AI provider not configured',
        code: 'AI_NOT_CONFIGURED'
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
