import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const generateAMPEmail = async (req, res) => {
  try {
    const { subject, content, interactiveElements } = req.body;

    // Use AI to generate AMP HTML with interactive elements
    const prompt = `Generate valid AMP HTML for email with interactive elements. Subject: ${subject}, Content: ${content}, Interactive elements: ${interactiveElements.join(', ')}. Include AMP components like amp-form, amp-selector, etc. Ensure it's Gmail/Outlook compatible.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const ampHtml = completion.choices[0].message.content;
    res.json({ ampHtml });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
