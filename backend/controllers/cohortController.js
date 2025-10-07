// express-async-handler removed - using native async/await
import Cohort from '../models/Cohort.js';
import Email from '../models/Email.js';

// @desc    Create cohort
// @route   POST /api/cohort/create
// @access  Private
const createCohort = async (req, res) => {
  try {
  const { name, signupDate, segmentType } = req.body;
  const userId = req.user._id;

  const cohort = await Cohort.create({
    user: userId,
    name,
    signupDate: new Date(signupDate),
    segmentType
  });

  res.status(201).json(cohort);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get cohorts
// @route   GET /api/cohort
// @access  Private
const getCohorts = async (req, res) => {
  try {
  const userId = req.user._id;
  const cohorts = await Cohort.find({ user: userId }).sort({ createdAt: -1 });
  res.json(cohorts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Analyze cohort retention
// @route   GET /api/cohort/:id/analysis
// @access  Private
const analyzeCohort = async (req, res) => {
  try {
  const cohort = await Cohort.findById(req.params.id).populate('members.contact');
  if (!cohort) {
    res.status(404);
    throw new Error('Cohort not found');
  }

  // Calculate retention rates for different periods
  const periods = [7, 14, 30, 60, 90]; // days
  const retentionRates = [];

  for (const period of periods) {
    const periodStart = new Date(cohort.signupDate);
    periodStart.setDate(periodStart.getDate() + period);

    const activeMembers = cohort.members.filter(member => {
      return member.lastActivity >= periodStart;
    });

    const retentionRate = (activeMembers.length / cohort.members.length) * 100;
    retentionRates.push({
      period,
      retained: activeMembers.length,
      churned: cohort.members.length - activeMembers.length,
      retentionRate: Math.round(retentionRate * 100) / 100
    });
  }

  cohort.retentionRates = retentionRates;
  await cohort.save();

  res.json({
    cohort,
    retentionRates,
    summary: {
      totalMembers: cohort.members.length,
      avgRetentionRate: retentionRates.reduce((sum, r) => sum + r.retentionRate, 0) / retentionRates.length,
      bestPeriod: retentionRates.reduce((best, current) => current.retentionRate > best.retentionRate ? current : best)
    }
  });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update cohort metrics
// @route   PUT /api/cohort/:id/metrics
// @access  Private
const updateCohortMetrics = async (req, res) => {
  try {
  const { contactId, metrics } = req.body;
  const cohort = await Cohort.findById(req.params.id);

  if (!cohort) {
    res.status(404);
    throw new Error('Cohort not found');
  }

  const memberIndex = cohort.members.findIndex(m => m.contact.toString() === contactId);
  if (memberIndex === -1) {
    cohort.members.push({
      contact: contactId,
      signupDate: new Date(),
      lastActivity: new Date(),
      metrics
    });
  } else {
    cohort.members[memberIndex].metrics = { ...cohort.members[memberIndex].metrics, ...metrics };
    cohort.members[memberIndex].lastActivity = new Date();
  }

  await cohort.save();
  res.json(cohort);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export {
  createCohort,
  getCohorts,
  analyzeCohort,
  updateCohortMetrics
};
