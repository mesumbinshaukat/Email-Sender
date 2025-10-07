import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const optimizeWaves = async (req, res) => {
  try {
    const { campaignId, recipientSegments } = req.body;

    const prompt = `Optimize email send waves for campaign ${campaignId} with segments: ${JSON.stringify(recipientSegments)}. Suggest staggered sends based on engagement patterns. Return JSON with waves array containing: segment, time, delay (in minutes).`;

    const completion = await openai.chat.completions.create({
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
