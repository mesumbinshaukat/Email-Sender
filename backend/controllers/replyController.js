import ReplyAnalysis from '../models/ReplyAnalysis.js';
import Email from '../models/Email.js';

// @desc    Analyze reply content with AI
// @route   POST /api/replies/analyze
// @access  Private
export const analyzeReply = async (req, res) => {
  try {
    const { emailId, replyContent, replyMetadata } = req.body;

    // Get the original email
    const originalEmail = await Email.findOne({
      _id: emailId,
      userId: req.user._id
    });

    if (!originalEmail) {
      return res.status(404).json({
        success: false,
        message: 'Original email not found',
      });
    }

    // Analyze the reply using AI
    const analysis = await performReplyAnalysis(replyContent);

    // Generate response suggestions
    const responseSuggestions = await generateResponseSuggestions(replyContent, analysis);

    // Create reply analysis record
    const replyAnalysis = await ReplyAnalysis.create({
      emailId,
      userId: req.user._id,
      originalEmail: {
        subject: originalEmail.subject,
        content: originalEmail.htmlBody || originalEmail.textBody,
        sentAt: originalEmail.sentAt,
      },
      replyContent,
      replyMetadata,
      analysis,
      responseSuggestions,
      actions: {
        priority: determinePriority(analysis),
        followUpNeeded: needsFollowUp(analysis),
        tags: generateTags(analysis),
      },
      aiProcessed: true,
    });

    res.json({
      success: true,
      data: replyAnalysis,
      message: 'Reply analyzed successfully',
    });
  } catch (error) {
    console.error('Analyze reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing reply',
      error: error.message,
    });
  }
};

// @desc    Get smart inbox with prioritized replies
// @route   GET /api/replies/inbox
// @access  Private
export const getSmartInbox = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || 'unread';
    const priority = req.query.priority;

    const query = { userId: req.user._id };
    if (status !== 'all') {
      query.status = status;
    }
    if (priority) {
      query['actions.priority'] = priority;
    }

    const replies = await ReplyAnalysis.find(query)
      .populate('emailId', 'subject to sentAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Add hot lead scores
    const repliesWithScores = replies.map(reply => ({
      ...reply.toObject(),
      hotLeadScore: reply.hotLeadScore,
    }));

    // Sort by priority and hot lead score
    repliesWithScores.sort((a, b) => {
      // First sort by priority
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityOrder[b.actions.priority] - priorityOrder[a.actions.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by hot lead score
      return b.hotLeadScore - a.hotLeadScore;
    });

    const total = await ReplyAnalysis.countDocuments(query);

    res.json({
      success: true,
      data: repliesWithScores,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: repliesWithScores.length,
      },
    });
  } catch (error) {
    console.error('Get smart inbox error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inbox',
      error: error.message,
    });
  }
};

// @desc    Generate response suggestions
// @route   POST /api/replies/suggest-response
// @access  Private
export const suggestResponse = async (req, res) => {
  try {
    const { replyId, context, tone = 'professional' } = req.body;

    const reply = await ReplyAnalysis.findOne({
      _id: replyId,
      userId: req.user._id,
    });

    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found',
      });
    }

    // Generate additional response suggestions
    const suggestions = await generateResponseSuggestions(
      reply.replyContent,
      reply.analysis,
      { context, tone }
    );

    // Add to existing suggestions
    reply.responseSuggestions.push(...suggestions);
    await reply.save();

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error('Suggest response error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating suggestions',
      error: error.message,
    });
  }
};

// @desc    Categorize reply manually
// @route   PUT /api/replies/:id/categorize
// @access  Private
export const categorizeReply = async (req, res) => {
  try {
    const { category, priority, tags, status, followUpDate } = req.body;

    const reply = await ReplyAnalysis.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found',
      });
    }

    // Update categorization
    if (category) {
      reply.analysis.intent.type = category;
    }
    if (priority) {
      reply.actions.priority = priority;
    }
    if (tags) {
      reply.actions.tags = tags;
    }
    if (status) {
      reply.status = status;
    }
    if (followUpDate) {
      reply.actions.followUpDate = new Date(followUpDate);
      reply.actions.followUpNeeded = true;
    }

    reply.actions.autoCategorized = false; // Mark as manually categorized
    await reply.save();

    res.json({
      success: true,
      data: reply,
      message: 'Reply categorized successfully',
    });
  } catch (error) {
    console.error('Categorize reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Error categorizing reply',
      error: error.message,
    });
  }
};

// @desc    Get hot leads from replies
// @route   GET /api/replies/hot-leads
// @access  Private
export const getHotLeads = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Find replies with high hot lead scores
    const hotLeads = await ReplyAnalysis.find({
      userId: req.user._id,
      status: { $ne: 'archived' },
    })
    .populate('emailId', 'subject to sentAt')
    .sort({ createdAt: -1 })
    .limit(100) // Get more to filter
    .exec();

    // Calculate and sort by hot lead score
    const scoredLeads = hotLeads
      .map(reply => ({
        ...reply.toObject(),
        hotLeadScore: reply.hotLeadScore,
      }))
      .filter(reply => reply.hotLeadScore >= 50) // Only high-scoring leads
      .sort((a, b) => b.hotLeadScore - a.hotLeadScore)
      .slice(0, limit);

    res.json({
      success: true,
      data: scoredLeads,
    });
  } catch (error) {
    console.error('Get hot leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hot leads',
      error: error.message,
    });
  }
};

// Helper function to perform AI analysis of reply
const performReplyAnalysis = async (content) => {
  try {
    const aiService = (await import('../services/aiService.js')).default;

    const messages = [
      {
        role: 'system',
        content: `You are an expert at analyzing email replies. Analyze the sentiment, intent, urgency, topics, and entities in the reply. Provide a detailed analysis in JSON format.`
      },
      {
        role: 'user',
        content: `Analyze this email reply: "${content}"

Return analysis as JSON with this structure:
{
  "sentiment": {"score": -1 to 1, "label": "positive|neutral|negative", "confidence": 0-1},
  "intent": {"type": "interested|not_interested|question|meeting_request|unsubscribe|complaint|positive_feedback|negative_feedback|neutral", "confidence": 0-1},
  "urgency": {"level": "low|medium|high", "score": 0-1},
  "topics": [{"topic": "string", "relevance": 0-1, "sentiment": -1 to 1}],
  "entities": [{"type": "person|organization|location|date|email|phone|url", "value": "string", "confidence": 0-1}]
}`
      }
    ];

    const response = await aiService.callAI(messages, null, 'reply_analysis', {
      temperature: 0.3,
      maxTokens: 800,
    });

    return JSON.parse(response);
  } catch (error) {
    console.error('Reply analysis error:', error);
    // Fallback analysis
    return {
      sentiment: { score: 0, label: 'neutral', confidence: 0.5 },
      intent: { type: 'neutral', confidence: 0.5 },
      urgency: { level: 'low', score: 0.2 },
      topics: [],
      entities: [],
    };
  }
};

// Helper function to generate response suggestions
const generateResponseSuggestions = async (replyContent, analysis, options = {}) => {
  try {
    const aiService = (await import('../services/aiService.js')).default;

    const messages = [
      {
        role: 'system',
        content: `You are an expert email responder. Generate 2-3 appropriate response suggestions based on the reply analysis.`
      },
      {
        role: 'user',
        content: `Generate response suggestions for this email reply:

Reply: "${replyContent}"

Analysis:
- Sentiment: ${analysis.sentiment.label} (${analysis.sentiment.score})
- Intent: ${analysis.intent.type}
- Urgency: ${analysis.urgency.level}

${options.context ? `Context: ${options.context}` : ''}
Tone: ${options.tone || 'professional'}

Provide 2-3 response suggestions as JSON array with objects containing: suggestion, confidence (0-1), tone, template.`
      }
    ];

    const response = await aiService.callAI(messages, null, 'response_suggestion', {
      temperature: 0.7,
      maxTokens: 600,
    });

    return JSON.parse(response);
  } catch (error) {
    console.error('Response generation error:', error);
    // Fallback suggestions
    return [
      {
        suggestion: 'Thank you for your reply. I appreciate your feedback.',
        confidence: 0.8,
        tone: 'professional',
        template: 'acknowledgment',
      },
      {
        suggestion: 'I\'d be happy to discuss this further. When would be a good time to connect?',
        confidence: 0.7,
        tone: 'professional',
        template: 'follow_up',
      },
    ];
  }
};

// Helper function to determine priority
const determinePriority = (analysis) => {
  if (analysis.intent.type === 'meeting_request' || analysis.urgency.level === 'high') {
    return 'urgent';
  }
  if (analysis.intent.type === 'interested' || analysis.sentiment.label === 'positive') {
    return 'high';
  }
  if (analysis.intent.type === 'complaint' || analysis.sentiment.label === 'negative') {
    return 'high';
  }
  return 'normal';
};

// Helper function to check if follow-up is needed
const needsFollowUp = (analysis) => {
  return ['interested', 'question', 'meeting_request', 'complaint'].includes(analysis.intent.type);
};

// Helper function to generate tags
const generateTags = (analysis) => {
  const tags = [];

  if (analysis.intent.type === 'interested') tags.push('interested');
  if (analysis.intent.type === 'meeting_request') tags.push('meeting');
  if (analysis.intent.type === 'question') tags.push('question');
  if (analysis.sentiment.label === 'positive') tags.push('positive');
  if (analysis.sentiment.label === 'negative') tags.push('negative');
  if (analysis.urgency.level === 'high') tags.push('urgent');

  return tags;
};
