import { getAIClient } from '../utils/openaiHelper.js';

export const predictCLV = async (req, res) => {
  try {
    const { contactId } = req.params;

    const aiClient = await getAIClient(req.user?._id);

    // Mock CLV prediction - in real implementation, use ML model on historical data
    const prompt = `Predict Customer Lifetime Value and next purchase timing for contact ${contactId}. Provide realistic estimates based on typical e-commerce patterns. Return JSON with: clv (number), nextPurchaseDays (number), insights (string).`;

    const completion = await aiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    try {
      const prediction = JSON.parse(completion.choices[0].message.content);
      res.json(prediction);
    } catch {
      // Fallback if AI doesn't return valid JSON
      res.json({
        clv: 1500,
        nextPurchaseDays: 30,
        insights: completion.choices[0].message.content
      });
    }
  } catch (error) {
    if (error.message.includes('API key not configured') || error.message.includes('No AI provider')) {
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
