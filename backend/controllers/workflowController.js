import asyncHandler from 'express-async-handler';
import Workflow from '../models/Workflow.js';
import Trigger from '../models/Trigger.js';

// @desc    Create workflow
// @route   POST /api/workflows/create
// @access  Private
const createWorkflow = asyncHandler(async (req, res) => {
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
});

// @desc    Get workflows
// @route   GET /api/workflows
// @access  Private
const getWorkflows = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const workflows = await Workflow.find({ user: userId }).populate('triggers');
  res.json(workflows);
});

// @desc    Update workflow
// @route   PUT /api/workflows/:id
// @access  Private
const updateWorkflow = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findById(req.params.id);
  if (!workflow) {
    res.status(404);
    throw new Error('Workflow not found');
  }

  Object.assign(workflow, req.body);
  await workflow.save();
  res.json(workflow);
});

// @desc    Execute workflow
// @route   POST /api/workflows/:id/execute
// @access  Private
const executeWorkflow = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findById(req.params.id);
  if (!workflow) {
    res.status(404);
    throw new Error('Workflow not found');
  }

  // Simplified execution logic
  res.json({ status: 'executed', workflowId: workflow._id });
});

// @desc    Get workflow analytics
// @route   GET /api/workflows/:id/analytics
// @access  Private
const getWorkflowAnalytics = asyncHandler(async (req, res) => {
  // Placeholder analytics
  res.json({
    executions: 150,
    successRate: 95,
    averageTime: '2.3s'
  });
});

// @desc    Create trigger
// @route   POST /api/triggers/create
// @access  Private
const createTrigger = asyncHandler(async (req, res) => {
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
});

// @desc    Get triggers
// @route   GET /api/triggers
// @access  Private
const getTriggers = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const triggers = await Trigger.find({ user: userId }).populate('workflow');
  res.json(triggers);
});

// @desc    Fire event
// @route   POST /api/triggers/fire-event
// @access  Private
const fireEvent = asyncHandler(async (req, res) => {
  const { eventType, data } = req.body;

  // Find matching triggers
  const triggers = await Trigger.find({
    type: eventType,
    isActive: true
  });

  // Execute actions (simplified)
  res.json({ triggered: triggers.length, eventType });
});

// @desc    Configure trigger
// @route   PUT /api/triggers/:id/configure
// @access  Private
const configureTrigger = asyncHandler(async (req, res) => {
  const trigger = await Trigger.findById(req.params.id);
  if (!trigger) {
    res.status(404);
    throw new Error('Trigger not found');
  }

  Object.assign(trigger, req.body);
  await trigger.save();
  res.json(trigger);
});

// @desc    Get trigger history
// @route   GET /api/triggers/:id/history
// @access  Private
const getTriggerHistory = asyncHandler(async (req, res) => {
  // Placeholder history
  res.json({
    executions: [
      { timestamp: new Date(), success: true },
      { timestamp: new Date(Date.now() - 86400000), success: true }
    ]
  });
});

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
