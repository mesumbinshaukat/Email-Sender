// express-async-handler removed - using native async/await
import ABTest from '../models/ABTest.js';

// @desc    Create A/B test
// @route   POST /api/ab-test/create
// @access  Private
const createABTest = async (req, res) => {
  try {
    const { name, description, testType, variants, settings } = req.body;
    const userId = req.user._id;

    const abTest = await ABTest.create({
      user: userId,
      name,
      description,
      testType,
      variants,
      settings
    });

    res.status(201).json(abTest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user's A/B tests
// @route   GET /api/ab-test
// @access  Private
const getABTests = async (req, res) => {
  try {
    const userId = req.user._id;
    const abTests = await ABTest.find({ user: userId }).sort({ createdAt: -1 });
    res.json(abTests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Start A/B test
// @route   POST /api/ab-test/:id/start
// @access  Private
const startABTest = async (req, res) => {
  try {
    const abTest = await ABTest.findById(req.params.id);
    if (!abTest) {
      return res.status(404).json({ message: 'A/B test not found' });
    }

    abTest.status = 'running';
    abTest.startedAt = new Date();
    await abTest.save();

    res.json(abTest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update test results
// @route   PUT /api/ab-test/:id/results
// @access  Private
const updateTestResults = async (req, res) => {
  try {
    const { variantIndex, metrics } = req.body;
    const abTest = await ABTest.findById(req.params.id);

    if (!abTest) {
      return res.status(404).json({ message: 'A/B test not found' });
    }

    if (abTest.variants[variantIndex]) {
      abTest.variants[variantIndex] = {
        ...abTest.variants[variantIndex],
        ...metrics
      };
    }

    // Check if test should be completed
    const totalSampleSize = abTest.variants.reduce((sum, v) => sum + v.sampleSize, 0);
    if (totalSampleSize >= abTest.settings.sampleSize) {
      await analyzeAndDeclareWinner(abTest);
    }

    await abTest.save();
    res.json(abTest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Analyze test results
// @route   GET /api/ab-test/:id/analysis
// @access  Private
const analyzeTest = async (req, res) => {
  try {
    const abTest = await ABTest.findById(req.params.id);
    if (!abTest) {
      return res.status(404).json({ message: 'A/B test not found' });
    }

    const analysis = await performStatisticalAnalysis(abTest);

    if (abTest.settings.autoDeclareWinner && analysis.winner) {
      abTest.winner = analysis.winner;
      abTest.status = 'completed';
      abTest.completedAt = new Date();
      abTest.statisticalData = analysis.statistics;
      await abTest.save();
    }

    res.json({
      abTest,
      analysis
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Declare winner manually
// @route   POST /api/ab-test/:id/declare-winner
// @access  Private
const declareWinner = async (req, res) => {
  try {
    const { variantIndex } = req.body;
    const abTest = await ABTest.findById(req.params.id);

    if (!abTest) {
      return res.status(404).json({ message: 'A/B test not found' });
    }

    const winnerVariant = abTest.variants[variantIndex];
    const baselineVariant = abTest.variants[0];

    let improvement = 0;
    switch (abTest.settings.winnerCriteria) {
      case 'opens':
        improvement = ((winnerVariant.opens / winnerVariant.sampleSize) -
                      (baselineVariant.opens / baselineVariant.sampleSize)) * 100;
        break;
      case 'clicks':
        improvement = ((winnerVariant.clicks / winnerVariant.sampleSize) -
                      (baselineVariant.clicks / baselineVariant.sampleSize)) * 100;
        break;
      case 'conversions':
        improvement = ((winnerVariant.conversions / winnerVariant.sampleSize) -
                      (baselineVariant.conversions / baselineVariant.sampleSize)) * 100;
        break;
    }

    abTest.winner = {
      variantIndex,
      confidence: 95,
      improvement: Math.round(improvement * 100) / 100,
      criteria: abTest.settings.winnerCriteria
    };

    abTest.status = 'completed';
    abTest.completedAt = new Date();

    await abTest.save();
    res.json(abTest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper functions
const performStatisticalAnalysis = async (abTest) => {
  const variants = abTest.variants;
  if (variants.length < 2) return { winner: null, statistics: null };

  // Simple statistical analysis (in production, use proper statistical libraries)
  const baseline = variants[0];
  let winner = null;
  let maxImprovement = 0;

  for (let i = 1; i < variants.length; i++) {
    const variant = variants[i];
    let improvement = 0;

    switch (abTest.settings.winnerCriteria) {
      case 'opens':
        improvement = (variant.opens / variant.sampleSize) - (baseline.opens / baseline.sampleSize);
        break;
      case 'clicks':
        improvement = (variant.clicks / variant.sampleSize) - (baseline.clicks / baseline.sampleSize);
        break;
      case 'conversions':
        improvement = (variant.conversions / variant.sampleSize) - (baseline.conversions / baseline.sampleSize);
        break;
    }

    if (improvement > maxImprovement) {
      maxImprovement = improvement;
      winner = {
        variantIndex: i,
        confidence: 95,
        improvement: Math.round(improvement * 100 * 100) / 100,
        criteria: abTest.settings.winnerCriteria
      };
    }
  }

  return {
    winner,
    statistics: {
      chiSquare: null, // Would calculate chi-square test
      pValue: null,
      significance: maxImprovement > 0,
      effectSize: maxImprovement
    }
  };
};

const analyzeAndDeclareWinner = async (abTest) => {
  const analysis = await performStatisticalAnalysis(abTest);

  if (analysis.winner && abTest.settings.autoDeclareWinner) {
    abTest.winner = analysis.winner;
    abTest.status = 'completed';
    abTest.completedAt = new Date();
    abTest.statisticalData = analysis.statistics;
  }
};

export {
  createABTest,
  getABTests,
  startABTest,
  updateTestResults,
  analyzeTest,
  declareWinner
};
