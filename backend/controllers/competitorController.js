import { Competitor, IndustryBenchmark } from '../models/Competitor.js';
import axios from 'axios';

// @desc    Add competitor for monitoring
// @route   POST /api/competitors/add
// @access  Private
export const addCompetitor = async (req, res) => {
  try {
    const { name, domain, industry, description, website, socialMedia } = req.body;

    console.log('🏢 Adding competitor for monitoring:', { name, domain, industry });

    // Check if competitor already exists for this user
    const existingCompetitor = await Competitor.findOne({
      userId: req.user._id,
      domain: domain.toLowerCase(),
    });

    if (existingCompetitor) {
      console.error('❌ Competitor already exists:', domain);
      return res.status(400).json({
        success: false,
        message: 'Competitor already exists in your monitoring list',
      });
    }

    // Create competitor
    const competitor = await Competitor.create({
      userId: req.user._id,
      name,
      domain: domain.toLowerCase(),
      industry,
      description,
      website,
      socialMedia: socialMedia || {},
      monitoringSettings: {
        active: true,
        emailCapture: true,
        frequency: 'weekly',
        alertThresholds: {
          openRateChange: 5,
          newCampaign: true,
          strategyChange: true,
        },
      },
    });

    console.log('✅ Competitor added successfully:', competitor._id);

    // Start initial analysis
    setImmediate(() => analyzeCompetitor(competitor._id));

    res.json({
      success: true,
      data: competitor,
      message: 'Competitor added and analysis started',
    });
  } catch (error) {
    console.error('❌ Add competitor error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding competitor',
      error: error.message,
    });
  }
};

// @desc    Get all competitors for user
// @route   GET /api/competitors
// @access  Private
export const getCompetitors = async (req, res) => {
  try {
    console.log('📊 Fetching competitors for user');

    const competitors = await Competitor.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    console.log(`✅ Found ${competitors.length} competitors`);

    res.json({
      success: true,
      data: competitors,
    });
  } catch (error) {
    console.error('❌ Get competitors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching competitors',
      error: error.message,
    });
  }
};

// @desc    Get competitor insights and analysis
// @route   GET /api/competitors/:id/insights
// @access  Private
export const getCompetitorInsights = async (req, res) => {
  try {
    const competitorId = req.params.id;

    console.log('🔍 Fetching competitor insights:', competitorId);

    const competitor = await Competitor.findOne({
      _id: competitorId,
      userId: req.user._id,
    });

    if (!competitor) {
      console.error('❌ Competitor not found:', competitorId);
      return res.status(404).json({
        success: false,
        message: 'Competitor not found',
      });
    }

    // Generate insights if needed
    if (competitor.insights.length === 0) {
      console.log('🤖 Generating competitor insights');
      competitor.insights = await generateCompetitorInsights(competitor);
      await competitor.save();
    }

    console.log(`✅ Returning ${competitor.insights.length} competitor insights`);

    res.json({
      success: true,
      data: {
        competitor,
        insights: competitor.insights,
      },
    });
  } catch (error) {
    console.error('❌ Get competitor insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching competitor insights',
      error: error.message,
    });
  }
};

// @desc    Get industry benchmarks
// @route   GET /api/competitors/benchmarks
// @access  Private
export const getIndustryBenchmarks = async (req, res) => {
  try {
    const { industry } = req.query;

    console.log('📊 Fetching industry benchmarks:', industry);

    let benchmarks;

    if (industry) {
      benchmarks = await IndustryBenchmark.findOne({ industry });
    } else {
      benchmarks = await IndustryBenchmark.find({});
    }

    if (!benchmarks || (Array.isArray(benchmarks) && benchmarks.length === 0)) {
      console.log('ℹ️ No benchmarks found, returning default data');
      // Return default benchmarks if none exist
      benchmarks = {
        industry: industry || 'general',
        metrics: {
          averageOpenRate: 24.5,
          averageClickRate: 3.2,
          averageUnsubscribeRate: 0.8,
          topSubjectKeywords: ['update', 'news', 'tips', 'guide', 'announcement'],
          optimalSendDays: ['tuesday', 'wednesday', 'thursday'],
          optimalSendTimes: ['10:00', '14:00'],
          contentLength: { average: 120, recommended: 100 },
          imageUsageRate: 65,
          personalizationRate: 45,
          mobileOptimizationRate: 78,
        },
      };
    }

    console.log('✅ Industry benchmarks retrieved');

    res.json({
      success: true,
      data: Array.isArray(benchmarks) ? benchmarks : [benchmarks],
    });
  } catch (error) {
    console.error('❌ Get industry benchmarks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching industry benchmarks',
      error: error.message,
    });
  }
};

// @desc    Get competitor trends and analysis
// @route   GET /api/competitors/trends
// @access  Private
export const getCompetitorTrends = async (req, res) => {
  try {
    console.log('📈 Analyzing competitor trends');

    const competitors = await Competitor.find({
      userId: req.user._id,
      'performanceMetrics.lastAnalyzed': { $exists: true },
    });

    const trends = {
      subjectLineTrends: {},
      contentStrategyTrends: {},
      timingPatterns: {},
      engagementTactics: {},
      overallInsights: [],
    };

    // Analyze subject lines
    competitors.forEach(comp => {
      comp.competitorEmails.forEach(email => {
        // Extract keywords from subject lines
        const words = email.subject.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length > 3) { // Ignore short words
            trends.subjectLineTrends[word] = (trends.subjectLineTrends[word] || 0) + 1;
          }
        });
      });
    });

    // Sort and get top trends
    trends.subjectLineTrends = Object.entries(trends.subjectLineTrends)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    console.log('✅ Competitor trends analyzed');

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error('❌ Get competitor trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing competitor trends',
      error: error.message,
    });
  }
};

// @desc    Update competitor monitoring settings
// @route   PUT /api/competitors/:id/settings
// @access  Private
export const updateCompetitorSettings = async (req, res) => {
  try {
    const { monitoringSettings } = req.body;

    console.log('⚙️ Updating competitor monitoring settings:', req.params.id);

    const competitor = await Competitor.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!competitor) {
      console.error('❌ Competitor not found for settings update');
      return res.status(404).json({
        success: false,
        message: 'Competitor not found',
      });
    }

    competitor.monitoringSettings = { ...competitor.monitoringSettings, ...monitoringSettings };
    await competitor.save();

    console.log('✅ Competitor settings updated');

    res.json({
      success: true,
      data: competitor.monitoringSettings,
      message: 'Monitoring settings updated successfully',
    });
  } catch (error) {
    console.error('❌ Update competitor settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating competitor settings',
      error: error.message,
    });
  }
};

// @desc    Remove competitor from monitoring
// @route   DELETE /api/competitors/:id
// @access  Private
export const removeCompetitor = async (req, res) => {
  try {
    const competitorId = req.params.id;

    console.log('🗑️ Removing competitor:', competitorId);

    const competitor = await Competitor.findOneAndDelete({
      _id: competitorId,
      userId: req.user._id,
    });

    if (!competitor) {
      console.error('❌ Competitor not found for removal');
      return res.status(404).json({
        success: false,
        message: 'Competitor not found',
      });
    }

    console.log('✅ Competitor removed successfully');

    res.json({
      success: true,
      message: 'Competitor removed from monitoring',
    });
  } catch (error) {
    console.error('❌ Remove competitor error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing competitor',
      error: error.message,
    });
  }
};

// Helper function to analyze competitor
const analyzeCompetitor = async (competitorId) => {
  try {
    console.log('🔍 Starting competitor analysis:', competitorId);

    const competitor = await Competitor.findById(competitorId);
    if (!competitor) return;

    // Simulate competitor analysis (in real implementation, this would scrape emails, analyze content, etc.)
    const analysisResults = {
      contentStrategy: {
        frequency: 'weekly',
        topics: ['industry news', 'product updates', 'tips and tricks'],
        tone: 'professional',
        ctaTypes: ['learn more', 'download', 'contact us'],
      },
      performanceMetrics: {
        openRate: Math.random() * 30 + 15, // 15-45%
        clickRate: Math.random() * 5 + 1, // 1-6%
        unsubscribeRate: Math.random() * 2, // 0-2%
        lastAnalyzed: new Date(),
      },
      competitorEmails: [
        {
          subject: 'Industry Trends You Need to Know',
          content: 'Latest trends in our industry...',
          sentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          performance: {
            opens: Math.floor(Math.random() * 1000) + 500,
            clicks: Math.floor(Math.random() * 50) + 10,
            unsubscribes: Math.floor(Math.random() * 10),
          },
        },
        // Add more sample emails...
      ],
    };

    // Update competitor with analysis results
    competitor.contentStrategy = analysisResults.contentStrategy;
    competitor.performanceMetrics = analysisResults.performanceMetrics;
    competitor.competitorEmails = analysisResults.competitorEmails;

    await competitor.save();

    console.log('✅ Competitor analysis completed:', competitorId);

  } catch (error) {
    console.error('❌ Competitor analysis error:', error);
  }
};

// Helper function to generate competitor insights
const generateCompetitorInsights = async (competitor) => {
  try {
    console.log('💡 Generating competitor insights');

    const insights = [];

    // Analyze subject lines
    if (competitor.competitorEmails.length > 0) {
      const subjects = competitor.competitorEmails.map(e => e.subject);
      const avgLength = subjects.reduce((sum, s) => sum + s.length, 0) / subjects.length;

      if (avgLength > 50) {
        insights.push({
          type: 'subject_line_trend',
          title: 'Long Subject Lines',
          description: `${competitor.name} uses subject lines averaging ${Math.round(avgLength)} characters`,
          impact: 'medium',
          actionable: true,
        });
      }
    }

    // Analyze content strategy
    if (competitor.contentStrategy?.topics) {
      insights.push({
        type: 'content_strategy',
        title: 'Content Focus Areas',
        description: `${competitor.name} focuses on: ${competitor.contentStrategy.topics.join(', ')}`,
        impact: 'high',
        actionable: true,
      });
    }

    // Performance insights
    if (competitor.performanceMetrics?.openRate > 25) {
      insights.push({
        type: 'engagement_tactic',
        title: 'High Open Rates',
        description: `${competitor.name} achieves ${competitor.performanceMetrics.openRate.toFixed(1)}% open rate`,
        impact: 'high',
        actionable: true,
      });
    }

    console.log(`💡 Generated ${insights.length} competitor insights`);

    return insights;

  } catch (error) {
    console.error('❌ Generate competitor insights error:', error);
    return [];
  }
};
