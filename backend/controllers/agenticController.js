import agenticService from '../services/agenticService.js';
import Campaign from '../models/Campaign.js';
import ContactSegment from '../models/ContactSegment.js';

/**
 * @desc    Optimize campaign with AI
 * @route   POST /api/agentic/campaigns/:id/optimize
 * @access  Private
 */
export const optimizeCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const result = await agenticService.optimizeCampaign(id, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Optimize campaign error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to optimize campaign',
    });
  }
};

/**
 * @desc    Auto-generate contact segments
 * @route   POST /api/agentic/segments/auto-generate
 * @access  Private
 */
export const autoGenerateSegments = async (req, res) => {
  try {
    const userId = req.user._id;

    const segments = await agenticService.autoGenerateSegments(userId);

    res.json({
      success: true,
      data: segments,
      message: `Generated ${segments.length} segments based on engagement patterns`,
    });
  } catch (error) {
    console.error('Auto-generate segments error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate segments',
    });
  }
};

/**
 * @desc    Get all segments for user
 * @route   GET /api/agentic/segments
 * @access  Private
 */
export const getSegments = async (req, res) => {
  try {
    const userId = req.user._id;

    const segments = await ContactSegment.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: segments,
    });
  } catch (error) {
    console.error('Get segments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch segments',
    });
  }
};

/**
 * @desc    Get follow-up opportunities
 * @route   GET /api/agentic/follow-ups
 * @access  Private
 */
export const getFollowUpOpportunities = async (req, res) => {
  try {
    const userId = req.user._id;

    const opportunities = await agenticService.processFollowUps(userId);

    res.json({
      success: true,
      data: opportunities,
      count: opportunities.length,
    });
  } catch (error) {
    console.error('Get follow-ups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch follow-up opportunities',
    });
  }
};

/**
 * @desc    Configure follow-up rules
 * @route   POST /api/agentic/follow-ups/configure
 * @access  Private
 */
export const configureFollowUpRules = async (req, res) => {
  try {
    const userId = req.user._id;
    const { rules } = req.body;

    const result = await agenticService.configureFollowUpRules(userId, rules);

    res.json({
      success: true,
      data: result,
      message: 'Follow-up rules configured successfully',
    });
  } catch (error) {
    console.error('Configure follow-ups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to configure follow-up rules',
    });
  }
};

/**
 * @desc    Get competitive intelligence report
 * @route   GET /api/agentic/intelligence/benchmark
 * @access  Private
 */
export const getBenchmarkReport = async (req, res) => {
  try {
    const userId = req.user._id;

    const report = await agenticService.generateBenchmarkReport(userId);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Benchmark report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate benchmark report',
    });
  }
};

/**
 * @desc    Get all campaigns
 * @route   GET /api/agentic/campaigns
 * @access  Private
 */
export const getCampaigns = async (req, res) => {
  try {
    const userId = req.user._id;

    const campaigns = await Campaign.find({ userId })
      .populate('emails')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns',
    });
  }
};

/**
 * @desc    Create new campaign
 * @route   POST /api/agentic/campaigns
 * @access  Private
 */
export const createCampaign = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, description, aiOptimization, schedule } = req.body;

    const campaign = await Campaign.create({
      userId,
      name,
      description,
      aiOptimization: {
        enabled: aiOptimization?.enabled || false,
        autoAdjustSendTime: aiOptimization?.autoAdjustSendTime || false,
        autoOptimizeSubject: aiOptimization?.autoOptimizeSubject || false,
        autoFollowUp: aiOptimization?.autoFollowUp || false,
      },
      schedule,
    });

    res.status(201).json({
      success: true,
      data: campaign,
      message: 'Campaign created successfully',
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create campaign',
    });
  }
};

/**
 * @desc    Get single campaign
 * @route   GET /api/agentic/campaigns/:id
 * @access  Private
 */
export const getCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const campaign = await Campaign.findOne({ _id: id, userId }).populate('emails');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign',
    });
  }
};

/**
 * @desc    Update campaign
 * @route   PUT /api/agentic/campaigns/:id
 * @access  Private
 */
export const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    const campaign = await Campaign.findOneAndUpdate(
      { _id: id, userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    res.json({
      success: true,
      data: campaign,
      message: 'Campaign updated successfully',
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update campaign',
    });
  }
};

/**
 * @desc    Delete campaign
 * @route   DELETE /api/agentic/campaigns/:id
 * @access  Private
 */
export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const campaign = await Campaign.findOneAndDelete({ _id: id, userId });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    res.json({
      success: true,
      message: 'Campaign deleted successfully',
    });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete campaign',
    });
  }
};
