import { getAIClient } from '../utils/openaiHelper.js';

export const adaptJourney = async (req, res) => {
  try {
    const { emailJourney, targetChannel } = req.body;

    const aiClient = await getAIClient(req.user?._id);

    const prompt = `Adapt email journey: ${JSON.stringify(emailJourney)} to ${targetChannel} channel. Suggest optimal switches and content reuse. Return JSON with steps array containing: step, content, channel.`;

    const completion = await aiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    try {
      const adaptedJourney = JSON.parse(completion.choices[0].message.content);
      res.json(adaptedJourney);
    } catch {
      // Fallback if AI doesn't return valid JSON
      res.json({
        steps: emailJourney.steps.map(step => ({
          ...step,
          channel: targetChannel,
          content: `${step.content} (adapted for ${targetChannel})`
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
