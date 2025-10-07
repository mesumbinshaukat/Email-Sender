import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const adaptJourney = async (req, res) => {
  try {
    const { emailJourney, targetChannel } = req.body;

    const prompt = `Adapt email journey: ${JSON.stringify(emailJourney)} to ${targetChannel} channel. Suggest optimal switches and content reuse. Return JSON with steps array containing: step, content, channel.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    try {
      const adaptedJourney = JSON.parse(completion.choices[0].message.content);
      res.json(adaptedJourney);
    } catch {
      // Fallback if AI doesn't return valid JSON
      res.json({
        steps: emailJourney.map(step => ({
          ...step,
          channel: targetChannel,
          content: `${step.content} (adapted for ${targetChannel})`
        }))
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
