import asyncHandler from 'express-async-handler';
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
const generateTemplate = asyncHandler(async (req, res) => {
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
});

// @desc    Get all templates for user
// @route   GET /api/design/templates
// @access  Private
const getTemplates = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const templates = await EmailTemplate.find({ user: userId }).populate('brandKit');
  res.json(templates);
});

// @desc    Customize template
// @route   POST /api/design/customize
// @access  Private
const customizeTemplate = asyncHandler(async (req, res) => {
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
});

// @desc    Preview template
// @route   GET /api/design/preview/:id
// @access  Private
const previewTemplate = asyncHandler(async (req, res) => {
  const template = await EmailTemplate.findById(req.params.id);
  if (!template) {
    res.status(404);
    throw new Error('Template not found');
  }

  res.json({ html: template.html, css: template.css });
});

// @desc    Save brand kit
// @route   POST /api/design/save-brand-kit
// @access  Private
const saveBrandKit = asyncHandler(async (req, res) => {
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
});

// @desc    Get brand kits
// @route   GET /api/design/brand-kits
// @access  Private
const getBrandKits = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const brandKits = await BrandKit.find({ user: userId });
  res.json(brandKits);
});

export {
  generateTemplate,
  getTemplates,
  customizeTemplate,
  previewTemplate,
  saveBrandKit,
  getBrandKits
};
