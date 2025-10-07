import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const collectData = async (req, res) => {
  try {
    const { emailId, quizResponses } = req.body;

    // Store zero-party data
    res.json({ message: 'Data collected', data: quizResponses });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const enrichProfile = async (req, res) => {
  try {
    const { contactId, zeroPartyData } = req.body;

    const prompt = `Enrich customer profile with zero-party data: ${JSON.stringify(zeroPartyData)}. Generate insights and personalization suggestions.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const enrichedProfile = completion.choices[0].message.content;
    res.json({ enrichedProfile });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
