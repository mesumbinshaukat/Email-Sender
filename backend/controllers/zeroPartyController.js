import { getAIClient } from '../utils/openaiHelper.js';

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

    const aiClient = await getAIClient(req.user?._id);

    const prompt = `Enrich customer profile with zero-party data: ${JSON.stringify(zeroPartyData)}. Generate insights and personalization suggestions.`;

    const completion = await aiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const enrichedProfile = completion.choices[0].message.content;
    res.json({ enrichedProfile });
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
