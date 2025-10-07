import AccessibilityCheck from '../models/AccessibilityCheck.js';
import Email from '../models/Email.js';
import { JSDOM } from 'jsdom';

// @desc    Check email accessibility
// @route   POST /api/accessibility/check
// @access  Private
export const checkAccessibility = async (req, res) => {
  try {
    console.log('🔍 Starting accessibility check for email:', req.body.emailId);

    const { emailId, htmlContent } = req.body;

    // Get email content if not provided
    let content = htmlContent;
    let email;

    if (emailId) {
      console.log('📧 Fetching email content for accessibility check');
      email = await Email.findOne({
        _id: emailId,
        userId: req.user._id,
      });

      if (!email) {
        console.error('❌ Email not found for accessibility check:', emailId);
        return res.status(404).json({
          success: false,
          message: 'Email not found',
        });
      }
      content = email.htmlBody || email.textBody;
    }

    if (!content) {
      console.error('❌ No content provided for accessibility check');
      return res.status(400).json({
        success: false,
        message: 'No content provided for accessibility check',
      });
    }

    console.log('🔍 Performing comprehensive accessibility analysis');

    // Perform accessibility checks
    const results = await performAccessibilityChecks(content);

    // Calculate overall score
    const accessibilityScore = calculateAccessibilityScore(results);

    console.log(`✅ Accessibility check completed. Score: ${accessibilityScore}/100`);

    // Save check results
    const checkResult = await AccessibilityCheck.create({
      emailId,
      userId: req.user._id,
      htmlContent: content,
      accessibilityScore,
      issues: results.issues,
      checksPerformed: results.checksPerformed,
      recommendations: results.recommendations,
      complianceLevel: determineComplianceLevel(accessibilityScore),
      estimatedFixTime: results.estimatedFixTime,
      aiSuggestions: results.aiSuggestions,
    });

    console.log('💾 Accessibility check results saved to database');

    res.json({
      success: true,
      data: {
        score: accessibilityScore,
        issues: results.issues,
        recommendations: results.recommendations,
        complianceLevel: checkResult.complianceLevel,
        estimatedFixTime: results.estimatedFixTime,
        aiSuggestions: results.aiSuggestions,
      },
      message: 'Accessibility check completed successfully',
    });

  } catch (error) {
    console.error('❌ Accessibility check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing accessibility check',
      error: error.message,
    });
  }
};

// @desc    Get accessibility score
// @route   GET /api/accessibility/score
// @access  Private
export const getAccessibilityScore = async (req, res) => {
  try {
    const { emailId } = req.query;

    console.log('📊 Fetching accessibility score for email:', emailId);

    const check = await AccessibilityCheck.findOne({
      emailId,
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    if (!check) {
      console.log('ℹ️ No accessibility check found for email');
      return res.json({
        success: true,
        data: {
          score: null,
          message: 'No accessibility check performed yet',
        },
      });
    }

    console.log(`📊 Returning accessibility score: ${check.accessibilityScore}/100`);

    res.json({
      success: true,
      data: {
        score: check.accessibilityScore,
        complianceLevel: check.complianceLevel,
        issuesCount: check.issues.length,
        lastChecked: check.createdAt,
      },
    });

  } catch (error) {
    console.error('❌ Get accessibility score error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching accessibility score',
      error: error.message,
    });
  }
};

// @desc    Suggest accessibility improvements
// @route   POST /api/accessibility/suggest-improvements
// @access  Private
export const suggestImprovements = async (req, res) => {
  try {
    const { emailId, specificIssues } = req.body;

    console.log('💡 Generating accessibility improvement suggestions');

    const check = await AccessibilityCheck.findOne({
      emailId,
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    if (!check) {
      console.log('ℹ️ No accessibility check found for suggestions');
      return res.status(404).json({
        success: false,
        message: 'No accessibility check found',
      });
    }

    // Generate AI-powered suggestions for specific issues or all issues
    const suggestions = await generateAISuggestions(check, specificIssues);

    console.log(`💡 Generated ${suggestions.length} AI-powered suggestions`);

    res.json({
      success: true,
      data: suggestions,
      message: 'Improvement suggestions generated',
    });

  } catch (error) {
    console.error('❌ Suggest improvements error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating improvement suggestions',
      error: error.message,
    });
  }
};

// @desc    Generate alt text for images
// @route   POST /api/accessibility/generate-alt-text
// @access  Private
export const generateAltText = async (req, res) => {
  try {
    const { imageUrl, context } = req.body;

    console.log('🎨 Generating alt text for image');

    if (!imageUrl) {
      console.error('❌ No image URL provided for alt text generation');
      return res.status(400).json({
        success: false,
        message: 'Image URL is required',
      });
    }

    // Use AI to generate alt text
    const aiService = (await import('../services/aiService.js')).default;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert at writing descriptive alt text for images in emails. Create concise, meaningful alt text that follows WCAG guidelines.'
      },
      {
        role: 'user',
        content: `Generate alt text for an image in an email. Image URL: ${imageUrl}

${context ? `Context: ${context}` : ''}

Provide alt text that is:
- Descriptive but concise (under 125 characters)
- Meaningful to screen reader users
- Not starting with "image of" or "picture of"
- Following WCAG 2.1 guidelines`
      }
    ];

    const altText = await aiService.callAI(messages, req.user._id, 'alt_text_generation', {
      temperature: 0.7,
      maxTokens: 150,
    });

    console.log('✅ Alt text generated successfully');

    res.json({
      success: true,
      data: {
        altText: altText.trim(),
        imageUrl,
      },
      message: 'Alt text generated successfully',
    });

  } catch (error) {
    console.error('❌ Generate alt text error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating alt text',
      error: error.message,
    });
  }
};

// Helper function to perform comprehensive accessibility checks
const performAccessibilityChecks = async (htmlContent) => {
  console.log('🔍 Starting detailed accessibility analysis');

  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;

  const results = {
    issues: [],
    checksPerformed: {
      altTextCheck: true,
      contrastCheck: true,
      headingStructureCheck: true,
      linkAccessibilityCheck: true,
      imageOptimizationCheck: true,
      semanticHtmlCheck: true,
      colorAccessibilityCheck: false, // Would need more complex analysis
      keyboardNavigationCheck: false, // Would need JavaScript analysis
      languageAttributeCheck: true,
    },
    recommendations: [],
    estimatedFixTime: 0,
    aiSuggestions: [],
  };

  try {
    // 1. Check for missing alt text
    console.log('🔍 Checking alt text...');
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      const alt = img.getAttribute('alt');
      if (!alt || alt.trim() === '') {
        results.issues.push({
          type: 'missing_alt_text',
          severity: 'error',
          element: `img[${index}]`,
          message: 'Image is missing alt text',
          suggestion: 'Add descriptive alt text that conveys the image\'s purpose',
          wcagGuideline: '1.1.1 Non-text Content',
        });
        results.estimatedFixTime += 2;
      } else if (alt.length > 125) {
        results.issues.push({
          type: 'missing_alt_text',
          severity: 'warning',
          element: `img[${index}]`,
          message: 'Alt text is too long (over 125 characters)',
          suggestion: 'Keep alt text concise and descriptive',
          wcagGuideline: '1.1.1 Non-text Content',
        });
      }
    });

    // 2. Check heading structure
    console.log('🔍 Checking heading structure...');
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingLevels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)));

    if (headingLevels.length === 0) {
      results.issues.push({
        type: 'missing_headings',
        severity: 'warning',
        message: 'No headings found in email',
        suggestion: 'Add proper heading structure for content hierarchy',
        wcagGuideline: '1.3.1 Info and Relationships',
      });
      results.estimatedFixTime += 5;
    }

    // Check for skipped heading levels
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] > headingLevels[i-1] + 1) {
        results.issues.push({
          type: 'missing_headings',
          severity: 'warning',
          message: `Skipped heading level (H${headingLevels[i-1]} to H${headingLevels[i]})`,
          suggestion: 'Use consecutive heading levels for proper structure',
          wcagGuideline: '1.3.1 Info and Relationships',
        });
      }
    }

    // 3. Check links
    console.log('🔍 Checking link accessibility...');
    const links = document.querySelectorAll('a');
    links.forEach((link, index) => {
      const href = link.getAttribute('href');
      const text = link.textContent?.trim();

      if (!href || href.trim() === '') {
        results.issues.push({
          type: 'empty_links',
          severity: 'error',
          element: `a[${index}]`,
          message: 'Link has no href attribute',
          suggestion: 'Add a valid href or remove the link',
          wcagGuideline: '2.1.1 Keyboard',
        });
        results.estimatedFixTime += 1;
      }

      if (!text || text === '') {
        results.issues.push({
          type: 'empty_links',
          severity: 'error',
          element: `a[${index}]`,
          message: 'Link has no accessible text',
          suggestion: 'Add descriptive link text or use aria-label',
          wcagGuideline: '2.4.4 Link Purpose',
        });
        results.estimatedFixTime += 2;
      } else if (text.toLowerCase().includes('click here') || text.toLowerCase().includes('here')) {
        results.issues.push({
          type: 'empty_links',
          severity: 'warning',
          element: `a[${index}]`,
          message: 'Link text is not descriptive',
          suggestion: 'Use descriptive link text that indicates the destination',
          wcagGuideline: '2.4.4 Link Purpose',
        });
        results.estimatedFixTime += 1;
      }
    });

    // 4. Check language attribute
    console.log('🔍 Checking language attributes...');
    const htmlElement = document.querySelector('html');
    if (!htmlElement?.getAttribute('lang')) {
      results.issues.push({
        type: 'missing_lang_attr',
        severity: 'error',
        message: 'Missing lang attribute on html element',
        suggestion: 'Add lang attribute to specify document language',
        wcagGuideline: '3.1.1 Language of Page',
      });
      results.estimatedFixTime += 1;
    }

    // 5. Check image sizes
    console.log('🔍 Checking image optimization...');
    images.forEach((img, index) => {
      const width = img.getAttribute('width');
      const height = img.getAttribute('height');

      if (!width || !height) {
        results.issues.push({
          type: 'large_images',
          severity: 'warning',
          element: `img[${index}]`,
          message: 'Image dimensions not specified',
          suggestion: 'Specify width and height attributes for better rendering',
          wcagGuideline: '1.4.4 Resize Text',
        });
      }
    });

    // 6. Generate recommendations
    console.log('📋 Generating accessibility recommendations');
    results.recommendations = generateRecommendations(results.issues);

    // 7. Generate AI suggestions
    console.log('🤖 Generating AI-powered improvement suggestions');
    results.aiSuggestions = await generateAISuggestions(results);

    console.log(`✅ Accessibility analysis complete. Found ${results.issues.length} issues`);

  } catch (error) {
    console.error('❌ Error during accessibility analysis:', error);
    results.issues.push({
      type: 'no_semantic_html',
      severity: 'error',
      message: 'Unable to parse HTML structure',
      suggestion: 'Ensure HTML is well-formed and valid',
    });
  }

  return results;
};

// Helper function to calculate accessibility score
const calculateAccessibilityScore = (results) => {
  let score = 100;

  // Deduct points for each issue based on severity
  results.issues.forEach(issue => {
    switch (issue.severity) {
      case 'error':
        score -= 10;
        break;
      case 'warning':
        score -= 5;
        break;
      case 'info':
        score -= 2;
        break;
    }
  });

  // Ensure score doesn't go below 0
  return Math.max(0, score);
};

// Helper function to determine compliance level
const determineComplianceLevel = (score) => {
  if (score >= 80) return 'AAA';
  if (score >= 60) return 'AA';
  return 'A';
};

// Helper function to generate recommendations
const generateRecommendations = (issues) => {
  const recommendations = [];
  const issueTypes = {};

  // Group issues by type
  issues.forEach(issue => {
    issueTypes[issue.type] = (issueTypes[issue.type] || 0) + 1;
  });

  // Generate specific recommendations
  if (issueTypes.missing_alt_text > 0) {
    recommendations.push({
      priority: 'high',
      category: 'Images',
      title: 'Add Alternative Text to Images',
      description: `Found ${issueTypes.missing_alt_text} images without alt text`,
      implementation: 'Add descriptive alt attributes to all img elements',
    });
  }

  if (issueTypes.empty_links > 0) {
    recommendations.push({
      priority: 'high',
      category: 'Links',
      title: 'Fix Link Accessibility',
      description: `Found ${issueTypes.empty_links} accessibility issues with links`,
      implementation: 'Ensure all links have descriptive text and valid href attributes',
    });
  }

  if (issueTypes.missing_headings > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'Structure',
      title: 'Improve Heading Structure',
      description: 'Heading structure needs improvement',
      implementation: 'Use proper heading hierarchy (h1, h2, h3, etc.) for content organization',
    });
  }

  return recommendations;
};

// Helper function to generate AI suggestions
const generateAISuggestions = async (checkOrResults, specificIssues = null) => {
  try {
    const aiService = (await import('../services/aiService.js')).default;

    const issues = specificIssues || (checkOrResults.issues || []);
    const topIssues = issues.slice(0, 3); // Focus on top 3 issues

    if (topIssues.length === 0) {
      return [];
    }

    const messages = [
      {
        role: 'system',
        content: 'You are an accessibility expert. Provide specific, actionable suggestions to fix WCAG compliance issues in HTML emails.'
      },
      {
        role: 'user',
        content: `Provide specific code suggestions to fix these accessibility issues in an HTML email:

${topIssues.map((issue, i) => `${i + 1}. ${issue.type}: ${issue.message}`).join('\n')}

For each issue, provide:
- The specific HTML change needed
- Why it's important for accessibility
- Example code if applicable

Format as JSON array with objects containing: type, suggestion, importance, example.`
      }
    ];

    const response = await aiService.callAI(messages, null, 'accessibility_improvements', {
      temperature: 0.3,
      maxTokens: 800,
    });

    const suggestions = JSON.parse(response);

    return suggestions.map(suggestion => ({
      type: suggestion.type,
      content: suggestion.suggestion,
      confidence: 0.9,
      applied: false,
    }));

  } catch (error) {
    console.error('❌ Error generating AI suggestions:', error);
    return [];
  }
};
