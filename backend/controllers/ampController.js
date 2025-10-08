import { getAIClient } from '../utils/openaiHelper.js';

export const generateAMPEmail = async (req, res) => {
  try {
    const { subject, content, interactiveElements } = req.body;

    const aiClient = await getAIClient(req.user?._id);

    // Use AI to generate AMP HTML with interactive elements
    const prompt = `Generate valid AMP HTML for email with interactive elements. Subject: ${subject}, Content: ${content}, Interactive elements: ${interactiveElements.join(', ')}. Include AMP components like amp-form, amp-selector, etc. Ensure it's Gmail/Outlook compatible.`;

    const completion = await aiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const ampHtml = completion.choices[0].message.content;
    res.json({ ampHtml });
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
