import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const personalize = async (req, res) => {
  try {
    const { template, recipientData } = req.body;

    const prompt = `Apply Liquid templating personalization to template: ${template} with data: ${JSON.stringify(recipientData)}. Generate personalized content.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const personalizedContent = completion.choices[0].message.content;
    res.json({ personalizedContent });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
