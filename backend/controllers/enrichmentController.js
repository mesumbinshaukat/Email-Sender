import Contact from '../models/Contact.js';
import axios from 'axios';

// @desc    Enrich contact with AI-powered research
// @route   POST /api/enrichment/contact/:email
// @access  Private
export const enrichContact = async (req, res) => {
  try {
    const { email } = req.params;
    const { forceRefresh = false } = req.query;

    // Find or create contact
    let contact = await Contact.findOne({ userId: req.user._id, email });

    if (!contact) {
      contact = await Contact.create({
        userId: req.user._id,
        email,
      });
    }

    // Check if enrichment is needed
    const needsEnrichment = forceRefresh ||
      !contact.enrichment.lastEnriched ||
      (new Date() - contact.enrichment.lastEnriched) > (7 * 24 * 60 * 60 * 1000); // 7 days

    if (!needsEnrichment) {
      return res.json({
        success: true,
        data: contact,
        message: 'Contact already recently enriched',
      });
    }

    // Perform enrichment
    const enrichmentData = await performContactEnrichment(email);

    // Update contact with enrichment data
    contact.name = enrichmentData.name;
    contact.company = enrichmentData.company;
    contact.position = enrichmentData.position;
    contact.location = enrichmentData.location;
    contact.social = enrichmentData.social;
    contact.enrichment.lastEnriched = new Date();
    contact.enrichment.sources = enrichmentData.sources;
    contact.enrichment.icebreakers = enrichmentData.icebreakers;
    contact.enrichment.talkingPoints = enrichmentData.talkingPoints;
    contact.enrichment.news = enrichmentData.news;

    await contact.save();

    res.json({
      success: true,
      data: contact,
      message: 'Contact enriched successfully',
    });
  } catch (error) {
    console.error('Enrich contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enriching contact',
      error: error.message,
    });
  }
};

// @desc    Get icebreakers for contact
// @route   GET /api/enrichment/icebreakers/:email
// @access  Private
export const getContactIcebreakers = async (req, res) => {
  try {
    const { email } = req.params;

    const contact = await Contact.findOne({ userId: req.user._id, email });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    const icebreakers = contact.enrichment.icebreakers || [];

    res.json({
      success: true,
      data: icebreakers,
    });
  } catch (error) {
    console.error('Get icebreakers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching icebreakers',
      error: error.message,
    });
  }
};

// @desc    Get company news
// @route   GET /api/enrichment/company-news/:domain
// @access  Private
export const getCompanyNews = async (req, res) => {
  try {
    const { domain } = req.params;

    // Use a news API or web scraping to get company news
    const news = await fetchCompanyNews(domain);

    res.json({
      success: true,
      data: news,
    });
  } catch (error) {
    console.error('Get company news error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company news',
      error: error.message,
    });
  }
};

// @desc    Generate talking points
// @route   POST /api/enrichment/talking-points
// @access  Private
export const generateTalkingPoints = async (req, res) => {
  try {
    const { contactEmail, context, tone = 'professional' } = req.body;

    const contact = await Contact.findOne({ userId: req.user._id, email: contactEmail });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    // Use AI to generate talking points
    const aiService = (await import('../services/aiService.js')).default;
    const talkingPoints = await aiService.generateTalkingPoints({
      contact: contact.toObject(),
      context: context || 'general business discussion',
      tone,
    });

    // Update contact with new talking points
    contact.enrichment.talkingPoints.push(...talkingPoints.map(tp => ({
      ...tp,
      generatedAt: new Date(),
    })));

    await contact.save();

    res.json({
      success: true,
      data: talkingPoints,
    });
  } catch (error) {
    console.error('Generate talking points error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating talking points',
      error: error.message,
    });
  }
};

// Helper function to perform contact enrichment
const performContactEnrichment = async (email) => {
  try {
    // Extract domain from email
    const domain = email.split('@')[1];

    // Simulate enrichment (in real implementation, use APIs like Hunter.io, LinkedIn, etc.)
    const enrichmentData = {
      name: {
        first: 'John',
        last: 'Doe',
        full: 'John Doe',
      },
      company: {
        name: 'Tech Corp',
        website: `https://${domain}`,
        industry: 'Technology',
        size: '51-200',
        linkedin: `https://linkedin.com/company/${domain.split('.')[0]}`,
      },
      position: {
        title: 'Software Engineer',
        level: 'senior',
        department: 'Engineering',
      },
      location: {
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        timezone: 'PST',
      },
      social: {
        linkedin: `https://linkedin.com/in/johndoe`,
        twitter: `https://twitter.com/johndoe`,
      },
      sources: [{
        type: 'ai_generated',
        url: null,
        data: { simulated: true },
        enrichedAt: new Date(),
      }],
      icebreakers: [
        {
          text: "I noticed you're at Tech Corp - I've been following their work in AI. What projects are you most excited about?",
          category: 'company',
          confidence: 0.9,
          generatedAt: new Date(),
        },
        {
          text: "As a fellow engineer in the Bay Area, I'm curious about your thoughts on the current tech scene here.",
          category: 'personal',
          confidence: 0.8,
          generatedAt: new Date(),
        },
      ],
      talkingPoints: [
        {
          topic: 'Recent Company News',
          content: 'Tech Corp recently launched their new AI platform',
          relevance: 0.85,
          category: 'company',
          generatedAt: new Date(),
        },
        {
          topic: 'Industry Trends',
          content: 'The shift towards cloud-native architectures',
          relevance: 0.75,
          category: 'professional',
          generatedAt: new Date(),
        },
      ],
      news: [
        {
          title: 'Tech Corp Announces New AI Initiative',
          summary: 'Company launches comprehensive AI platform for enterprise customers',
          url: `https://${domain}/news/ai-initiative`,
          publishedAt: new Date(),
          relevance: 0.9,
        },
      ],
    };

    // In a real implementation, you would:
    // 1. Use Hunter.io or similar for email verification and basic data
    // 2. Scrape LinkedIn for professional information
    // 3. Use company website APIs or scraping for company data
    // 4. Use news APIs for recent company news
    // 5. Use AI services to generate personalized content

    return enrichmentData;
  } catch (error) {
    console.error('Contact enrichment error:', error);
    throw error;
  }
};

// Helper function to fetch company news
const fetchCompanyNews = async (domain) => {
  try {
    // Simulate news fetching (use NewsAPI, Google News API, etc.)
    const mockNews = [
      {
        title: `${domain} Expands Operations`,
        summary: `Company announces new office locations and hiring initiatives`,
        url: `https://${domain}/news/expansion`,
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        relevance: 0.8,
      },
      {
        title: `Industry Recognition for ${domain}`,
        summary: `Company receives award for innovation in their field`,
        url: `https://${domain}/news/award`,
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        relevance: 0.7,
      },
    ];

    return mockNews;
  } catch (error) {
    console.error('Fetch company news error:', error);
    return [];
  }
};
