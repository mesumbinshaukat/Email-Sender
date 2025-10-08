import { getAIClient } from '../utils/openaiHelper.js';

export const personalize = async (req, res) => {
  try {
    const { template, recipientData } = req.body;

    const aiClient = await getAIClient(req.user?._id);

    const prompt = `Apply Liquid templating personalization to template: ${template} with data: ${JSON.stringify(recipientData)}. Generate personalized content.`;

    const completion = await aiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const personalizedContent = completion.choices[0].message.content;
    res.json({ personalizedContent });
  } catch (error) {
    if (error.message.includes('API key not configured')) {
      return res.status(400).json({
        success: false,
        message: 'AI provider not configured',
        code: 'AI_NOT_CONFIGURED',
        action: 'Please configure an AI provider in settings'
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
