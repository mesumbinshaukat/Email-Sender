import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const predictCLV = async (req, res) => {
  try {
    const { contactId } = req.params;

    // Mock CLV prediction - in real implementation, use ML model on historical data
    const prompt = `Predict Customer Lifetime Value and next purchase timing for contact ${contactId}. Provide realistic estimates based on typical e-commerce patterns. Return JSON with: clv (number), nextPurchaseDays (number), insights (string).`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    try {
      const prediction = JSON.parse(completion.choices[0].message.content);
      res.json(prediction);
    } catch {
      // Fallback if AI doesn't return valid JSON
      res.json({
        clv: 2500,
        nextPurchaseDays: 30,
        insights: completion.choices[0].message.content
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
