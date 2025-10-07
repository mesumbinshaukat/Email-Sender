import { OpenAI } from 'openai';
import axios from 'axios';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const generatePersonalizedVisual = async (req, res) => {
  try {
    const { recipientData, baseImage, visualType } = req.body;

    // Use AI to generate personalized visual description
    const prompt = `Based on recipient data: ${JSON.stringify(recipientData)}, create a personalized ${visualType} description for email marketing. Make it highly relevant and engaging.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const description = completion.choices[0].message.content;

    // In a real implementation, use DALL-E or similar to generate image
    // For now, return the description
    res.json({ description, visualType });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getLiveData = async (req, res) => {
  try {
    const { email } = req.params;

    // Mock live data - in real implementation, fetch from various APIs
    const liveData = {
      weather: 'sunny',
      location: 'New York',
      interests: ['technology', 'sports'],
      recentActivity: 'viewed product page'
    };

    res.json(liveData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
