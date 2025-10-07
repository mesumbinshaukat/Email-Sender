// express-async-handler removed - using native async/await
import Trigger from '../models/Trigger.js';
import User from '../models/User.js';

// @desc    Get all triggers for user
// @route   GET /api/triggers
// @access  Private
const getTriggers = async (req, res) => {
  try {
    const userId = req.user._id;
    const triggers = await Trigger.find({ user: userId }).populate('workflow');
    res.json(triggers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create smart trigger
// @route   POST /api/triggers/smart
// @access  Private
const createSmartTrigger = async (req, res) => {
  try {
    const { name, type, conditions, actions, workflowId } = req.body;
    const userId = req.user._id;

    const trigger = await Trigger.create({
    user: userId,
    name,
    type,
    conditions,
    actions,
    workflow: workflowId
    });

    res.status(201).json(trigger);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update trigger
// @route   PUT /api/triggers/:id
// @access  Private
const updateTrigger = async (req, res) => {
  try {
    const trigger = await Trigger.findById(req.params.id);
    if (!trigger) {
    res.status(404);
    throw new Error('Trigger not found');
    }

    Object.assign(trigger, req.body);
    await trigger.save();
    res.json(trigger);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete trigger
// @route   DELETE /api/triggers/:id
// @access  Private
const deleteTrigger = async (req, res) => {
  try {
    const trigger = await Trigger.findById(req.params.id);
    if (!trigger) {
    res.status(404);
    throw new Error('Trigger not found');
    }

    await trigger.remove();
    res.json({ message: 'Trigger deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Fire event (simulate event triggering)
// @route   POST /api/triggers/fire-event
// @access  Private
const fireEvent = async (req, res) => {
  try {
    const { eventType, data } = req.body;
    const userId = req.user._id;

    // Find matching triggers
    const triggers = await Trigger.find({
    user: userId,
    type: eventType,
    isActive: true
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

  // Simulate executing actions
  const results = triggers.map(trigger => ({
    triggerId: trigger._id,
    name: trigger.name,
    actionsExecuted: trigger.actions.length
  }));

  res.json({
    triggered: triggers.length,
    eventType,
    results
  });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get trigger analytics
// @route   GET /api/triggers/:id/analytics
// @access  Private
const getTriggerAnalytics = async (req, res) => {
  try {
  // Placeholder analytics
  res.json({
    executions: 45,
    successRate: 92,
    lastExecuted: new Date(),
    topEvents: ['email_open', 'website_visit', 'form_submit']
  });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Test trigger
// @route   POST /api/triggers/:id/test
// @access  Private
const testTrigger = async (req, res) => {
  try {
    const { testData } = req.body;
    const trigger = await Trigger.findById(req.params.id);

    if (!trigger) {
    res.status(404);
    throw new Error('Trigger not found');
    }

    // Simulate condition evaluation
    const conditionsMet = true; // In real implementation, evaluate conditions

    res.json({
    triggerId: trigger._id,
    conditionsMet,
    wouldExecute: conditionsMet,
    testData
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export {
  getTriggers,
  createSmartTrigger,
  updateTrigger,
  deleteTrigger,
  fireEvent,
  getTriggerAnalytics,
  testTrigger
};
