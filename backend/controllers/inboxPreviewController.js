import asyncHandler from 'express-async-handler';
import InboxPreview from '../models/InboxPreview.js';
import { getEnvVar } from '../utils/envManager.js';

// @desc    Generate inbox preview
// @route   POST /api/inbox-preview/generate
// @access  Private
const generatePreview = asyncHandler(async (req, res) => {
  const { emailId } = req.body;
  const userId = req.user._id;

  // Check if preview already exists
  let preview = await InboxPreview.findOne({ email: emailId, user: userId });

  if (!preview) {
    preview = await InboxPreview.create({
      user: userId,
      email: emailId,
      status: 'processing'
    });

    // Start async preview generation
    generateInboxPreviews(preview);
  }

  res.status(200).json(preview);
});

// @desc    Get preview results
// @route   GET /api/inbox-preview/:emailId
// @access  Private
const getPreview = asyncHandler(async (req, res) => {
  const { emailId } = req.params;
  const userId = req.user._id;

  const preview = await InboxPreview.findOne({ email: emailId, user: userId })
    .populate('email');

  if (!preview) {
    res.status(404);
    throw new Error('Preview not found');
  }

  res.json(preview);
});

// @desc    Get preview by ID
// @route   GET /api/inbox-preview/preview/:id
// @access  Private
const getPreviewById = asyncHandler(async (req, res) => {
  const preview = await InboxPreview.findById(req.params.id).populate('email');

  if (!preview) {
    res.status(404);
    throw new Error('Preview not found');
  }

  res.json(preview);
});

// @desc    Get user's previews
// @route   GET /api/inbox-preview
// @access  Private
const getPreviews = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const previews = await InboxPreview.find({ user: userId })
    .populate('email')
    .sort({ createdAt: -1 });

  res.json(previews);
});

// @desc    Regenerate preview
// @route   POST /api/inbox-preview/:id/regenerate
// @access  Private
const regeneratePreview = asyncHandler(async (req, res) => {
  const preview = await InboxPreview.findById(req.params.id);

  if (!preview) {
    res.status(404);
    throw new Error('Preview not found');
  }

  preview.status = 'processing';
  preview.previews = [];
  await preview.save();

  // Regenerate previews
  generateInboxPreviews(preview);

  res.json(preview);
});

// Helper functions
const generateInboxPreviews = async (preview) => {
  try {
    const clients = [
      'gmail', 'outlook', 'yahoo', 'apple_mail', 'thunderbird',
      'iphone', 'android', 'webmail'
    ];

    const previews = [];

    for (const client of clients) {
      const clientPreview = await generateClientPreview(preview.email, client);
      previews.push(clientPreview);
    }

    // Calculate overall score
    const totalScore = previews.reduce((sum, p) => sum + p.score, 0);
    const overallScore = Math.round(totalScore / previews.length);

    // Generate recommendations
    const recommendations = generateRecommendations(previews);

    preview.previews = previews;
    preview.overallScore = overallScore;
    preview.recommendations = recommendations;
    preview.status = 'completed';
    preview.completedAt = new Date();

    await preview.save();

  } catch (error) {
    console.error('Preview generation error:', error);
    preview.status = 'failed';
    await preview.save();
  }
};

const generateClientPreview = async (email, client) => {
  // This would integrate with actual inbox preview services
  // For now, simulate preview generation

  const issues = [];
  let score = 85; // Base score

  // Simulate client-specific issues
  switch (client) {
    case 'gmail':
      if (email.subject?.length > 78) {
        issues.push({
          type: 'mobile_unfriendly',
          severity: 'medium',
          message: 'Subject line may be truncated on mobile',
          suggestion: 'Keep subject lines under 78 characters'
        });
        score -= 5;
      }
      break;

    case 'outlook':
      if (email.html?.includes('position: absolute')) {
        issues.push({
          type: 'css_unsupported',
          severity: 'high',
          message: 'Outlook has limited CSS support',
          suggestion: 'Use table-based layouts for better compatibility'
        });
        score -= 15;
      }
      break;

    case 'yahoo':
      if (!email.html?.includes('alt=')) {
        issues.push({
          type: 'images_blocked',
          severity: 'medium',
          message: 'Images may be blocked by default',
          suggestion: 'Always include alt text for images'
        });
        score -= 5;
      }
      break;
  }

  // Check for common spam triggers
  const spamWords = ['free', 'guarantee', 'urgent', 'act now'];
  const subjectLower = email.subject?.toLowerCase() || '';
  if (spamWords.some(word => subjectLower.includes(word))) {
    issues.push({
      type: 'spam_triggers',
      severity: 'high',
      message: 'Subject contains potential spam trigger words',
      suggestion: 'Avoid words like "free", "guarantee", "urgent"'
    });
    score -= 10;
  }

  return {
    client,
    device: 'desktop',
    html: email.html,
    text: email.text,
    score: Math.max(0, score),
    issues,
    generatedAt: new Date()
  };
};

const generateRecommendations = (previews) => {
  const recommendations = [];
  const issueCount = {};

  // Count issues across all clients
  previews.forEach(preview => {
    preview.issues.forEach(issue => {
      issueCount[issue.type] = (issueCount[issue.type] || 0) + 1;
    });
  });

  // Generate recommendations based on issue frequency
  Object.entries(issueCount).forEach(([type, count]) => {
    if (count >= 3) { // Issue appears in 3+ clients
      let recommendation = {
        priority: 'high',
        category: type,
        message: '',
        action: ''
      };

      switch (type) {
        case 'css_unsupported':
          recommendation.message = 'CSS compatibility issues detected';
          recommendation.action = 'Use table-based layouts and avoid modern CSS';
          break;
        case 'images_blocked':
          recommendation.message = 'Images may be blocked in several clients';
          recommendation.action = 'Include alt text and consider text-only versions';
          break;
        case 'mobile_unfriendly':
          recommendation.message = 'Mobile rendering issues found';
          recommendation.action = 'Test and optimize for mobile devices';
          break;
        case 'spam_triggers':
          recommendation.message = 'Potential spam filter triggers detected';
          recommendation.action = 'Review subject lines and content for spam keywords';
          break;
      }

      recommendations.push(recommendation);
    }
  });

  return recommendations;
};

export {
  generatePreview,
  getPreview,
  getPreviewById,
  getPreviews,
  regeneratePreview
};
