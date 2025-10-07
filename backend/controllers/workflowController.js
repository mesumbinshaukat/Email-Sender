// express-async-handler removed - using native async/await
import Workflow from '../models/Workflow.js';
import Trigger from '../models/Trigger.js';

// @desc    Create workflow
// @route   POST /api/workflows/create
// @access  Private
const createWorkflow = async (req, res) => {
  try {
    const { name, description, nodes, edges } = req.body;
    const userId = req.user._id;

    const workflow = await Workflow.create({
    user: userId,
    name,
    description,
    nodes,
    edges
    });

    res.status(201).json(workflow);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get workflows
// @route   GET /api/workflows
// @access  Private
const getWorkflows = async (req, res) => {
  try {
    const userId = req.user._id;
    const workflows = await Workflow.find({ user: userId }).populate('triggers');
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update workflow
// @route   PUT /api/workflows/:id
// @access  Private
const updateWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    Object.assign(workflow, req.body);
    await workflow.save();
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Execute workflow
// @route   POST /api/workflows/:id/execute
// @access  Private
const executeWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    // Simplified execution logic
    res.json({ status: 'executed', workflowId: workflow._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get workflow analytics
// @route   GET /api/workflows/:id/analytics
// @access  Private
const getWorkflowAnalytics = async (req, res) => {
  try {
  // Placeholder analytics
  res.json({
    executions: 150,
    successRate: 95,
    averageTime: '2.3s'
  });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create trigger
// @route   POST /api/triggers/create
// @access  Private
const createTrigger = async (req, res) => {
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

    if (workflowId) {
    const workflow = await Workflow.findById(workflowId);
    if (workflow) {
      workflow.triggers.push(trigger._id);
      await workflow.save();
    }
    }

    res.status(201).json(trigger);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get triggers
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

// @desc    Fire event
// @route   POST /api/triggers/fire-event
// @access  Private
const fireEvent = async (req, res) => {
  try {
    const { eventType, data } = req.body;

    // Find matching triggers
    const triggers = await Trigger.find({
    type: eventType,
    isActive: true
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

    // Execute actions (simplified)
  res.json({ triggered: triggers.length, eventType });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Configure trigger
// @route   PUT /api/triggers/:id/configure
// @access  Private
const configureTrigger = async (req, res) => {
  try {
    const trigger = await Trigger.findById(req.params.id);
    if (!trigger) {
      return res.status(404).json({ message: 'Trigger not found' });
    }

    Object.assign(trigger, req.body);
    await trigger.save();
    res.json(trigger);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get trigger history
// @route   GET /api/triggers/:id/history
// @access  Private
const getTriggerHistory = async (req, res) => {
  try {
  // Placeholder history
  res.json({
    executions: [
      { timestamp: new Date(), success: true },
      { timestamp: new Date(Date.now() - 86400000), success: true }
    ]
  });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export {
  createWorkflow,
  getWorkflows,
  updateWorkflow,
  executeWorkflow,
  getWorkflowAnalytics,
  createTrigger,
  getTriggers,
  fireEvent,
  configureTrigger,
  getTriggerHistory
};
