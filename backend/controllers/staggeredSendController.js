import { getAIClient } from '../utils/openaiHelper.js';

export const optimizeWaves = async (req, res) => {
  try {
    const { campaignId, recipientSegments } = req.body;

    const aiClient = await getAIClient(req.user?._id);

    const prompt = `Optimize email send waves for campaign ${campaignId} with segments: ${JSON.stringify(recipientSegments)}. Suggest staggered sends based on engagement patterns. Return JSON with waves array containing: segment, time, delay (in minutes).`;

    const completion = await aiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    try {
      const optimization = JSON.parse(completion.choices[0].message.content);
      res.json(optimization);
    } catch {
      // Fallback if AI doesn't return valid JSON
      res.json({
        waves: recipientSegments.map((segment, index) => ({
          segment,
          time: `Wave ${index + 1}`,
          delay: index * 30
        }))
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
