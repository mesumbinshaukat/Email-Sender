// express-async-handler removed - using native async/await
import OpenAI from 'openai';
import EmailTemplate from '../models/EmailTemplate.js';
import BrandKit from '../models/BrandKit.js';
import User from '../models/User.js';
import { getEnvVar } from '../utils/envManager.js';

// Initialize OpenAI with dynamic API key
const getOpenAIClient = async () => {
  const apiKey = await getEnvVar('OPENAI_API_KEY');
  return new OpenAI({ apiKey });
};

// @desc    Generate email template from description
// @route   POST /api/design/generate-template
// @access  Private
const generateTemplate = async (req, res) => {
  try {
  const { description, brandKitId } = req.body;
  const userId = req.user._id;

  let brandKit = null;
  if (brandKitId) {
    brandKit = await BrandKit.findById(brandKitId);
  } else {
    // Get default brand kit
    brandKit = await BrandKit.findOne({ user: userId, isDefault: true });
  }

  const prompt = `Generate an HTML email template based on this description: ${description}
${brandKit ? `Use these brand colors: ${JSON.stringify(brandKit.colors)}, fonts: ${JSON.stringify(brandKit.fonts)}, logo: ${brandKit.logo?.url}` : ''}
Make it responsive, accessible, and mobile-friendly. Include proper HTML structure with inline CSS.`;

  const openai = await getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000
  });

  const html = completion.choices[0].message.content;

  // Extract variables from HTML (basic regex)
  const variables = [];
  const varMatches = html.match(/\{\{(\w+)\}\}/g);
  if (varMatches) {
    varMatches.forEach(match => {
      const varName = match.replace(/\{\{|\}\}/g, '');
      if (!variables.includes(varName)) variables.push(varName);
    });
  }

  const template = await EmailTemplate.create({
    user: userId,
    name: `Generated Template - ${new Date().toISOString().split('T')[0]}`,
    description,
    html,
    brandKit: brandKit?._id,
    variables: variables.map(v => ({ name: v, type: 'string', defaultValue: '' }))
  });

  res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all templates for user
// @route   GET /api/design/templates
// @access  Private
const getTemplates = async (req, res) => {
  try {
  const userId = req.user._id;
  const templates = await EmailTemplate.find({ user: userId }).populate('brandKit');
  res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Customize template
// @route   POST /api/design/customize
// @access  Private
const customizeTemplate = async (req, res) => {
  try {
  const { templateId, customizations } = req.body;

  const template = await EmailTemplate.findById(templateId);
  if (!template) {
    res.status(404);
    throw new Error('Template not found');
  }

  // Apply customizations (basic implementation)
  let html = template.html;
  Object.keys(customizations).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    html = html.replace(regex, customizations[key]);
  });

  res.json({ html });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Preview template
// @route   GET /api/design/preview/:id
// @access  Private
const previewTemplate = async (req, res) => {
  try {
  const template = await EmailTemplate.findById(req.params.id);
  if (!template) {
    res.status(404);
    throw new Error('Template not found');
  }

  res.json({ html: template.html, css: template.css });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Save brand kit
// @route   POST /api/design/save-brand-kit
// @access  Private
const saveBrandKit = async (req, res) => {
  try {
  const { name, logo, colors, fonts, brandGuidelines } = req.body;
  const userId = req.user._id;

  const brandKit = await BrandKit.create({
    user: userId,
    name,
    logo,
    colors,
    fonts,
    brandGuidelines
  });

  res.status(201).json(brandKit);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get brand kits
// @route   GET /api/design/brand-kits
// @access  Private
const getBrandKits = async (req, res) => {
  try {
  const userId = req.user._id;
  const brandKits = await BrandKit.find({ user: userId });
  res.json(brandKits);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export {
  generateTemplate,
  getTemplates,
  customizeTemplate,
  previewTemplate,
  saveBrandKit,
  getBrandKits
};
