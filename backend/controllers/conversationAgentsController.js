import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const generateResponse = async (req, res) => {
  try {
    const { replyContent, sentiment } = req.body;

    const prompt = `Analyze this customer reply: "${replyContent}". Sentiment: ${sentiment}. Generate a context-aware response. If complex, suggest escalation.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const response = completion.choices[0].message.content;
    res.json({ response, escalate: response.includes('escalate') });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
