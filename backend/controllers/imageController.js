// express-async-handler removed - using native async/await
import sharp from 'sharp';
import Image from '../models/Image.js';
import { getAIClient } from '../utils/openaiHelper.js';

// @desc    Generate image
// @route   POST /api/images/generate
// @access  Private
const generateImage = async (req, res) => {
  try {
    const { prompt, size = '1024x1024' } = req.body;
    const userId = req.user._id;

    const aiClient = await getAIClient(userId);
    const response = await aiClient.images.generate({
      prompt,
      n: 1,
      size
    });

    const imageUrl = response.data[0].url;

    const image = await Image.create({
      user: userId,
      prompt,
      url: imageUrl
    });

    res.status(201).json(image);
  } catch (error) {
    if (error.message.includes('API key not configured') || error.message.includes('No AI provider')) {
      return res.status(400).json({
        success: false,
        message: 'AI provider not configured',
        code: 'AI_NOT_CONFIGURED'
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Optimize image
// @route   POST /api/images/optimize
// @access  Private
const optimizeImage = async (req, res) => {
  try {
  const { imageId } = req.body;

  const image = await Image.findById(imageId);
  if (!image) {
    res.status(404);
    throw new Error('Image not found');
  }

  // Fetch image buffer
  const axios = (await import('axios')).default;
  const response = await axios.get(image.url, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data);

  // Optimize with sharp
  const optimizedBuffer = await sharp(buffer)
    .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  // In real app, upload to CDN and get URL
  // For now, just mark as optimized
  image.optimizedUrl = `optimized-${image.url}`;
  image.isOptimized = true;
  image.size = optimizedBuffer.length;
  await image.save();

  res.json({ optimizedUrl: image.optimizedUrl, size: image.size });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Generate alt text
// @route   POST /api/images/generate-alt-text
// @access  Private
const generateAltText = async (req, res) => {
  try {
  const { imageId } = req.body;

  const image = await Image.findById(imageId);
  if (!image) {
    res.status(404);
    throw new Error('Image not found');
  }

  const prompt = `Generate concise, descriptive alt text for an image with this description: "${image.prompt}". Make it accessible and SEO-friendly.`;

  const aiClient = await getAIClient(req.user._id);
  const completion = await aiClient.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 50
  });

  const altText = completion.choices[0].message.content.trim();

  image.altText = altText;
  await image.save();

  res.json({ altText });
  } catch (error) {
    if (error.message.includes('API key not configured') || error.message.includes('No AI provider')) {
      return res.status(400).json({
        success: false,
        message: 'AI provider not configured',
        code: 'AI_NOT_CONFIGURED'
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    A/B test images
// @route   POST /api/images/ab-test
// @access  Private
const abTestImages = async (req, res) => {
  try {
  const { imageIds, testName } = req.body;

  // Simplified: just return test setup
  res.json({
    testId: `test-${Date.now()}`,
    images: imageIds,
    status: 'running'
  });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get image library
// @route   GET /api/images/library
// @access  Private
const getImageLibrary = async (req, res) => {
  try {
  const userId = req.user._id;
  const images = await Image.find({ user: userId }).sort({ createdAt: -1 });
  res.json(images);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export {
  generateImage,
  optimizeImage,
  generateAltText,
  abTestImages,
  getImageLibrary
};
