import express from 'express';
import {
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
} from '../controllers/workflowController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Workflow routes
router.post('/create', protect, createWorkflow);
router.get('/', protect, getWorkflows);
router.put('/:id', protect, updateWorkflow);
router.post('/:id/execute', protect, executeWorkflow);
router.get('/:id/analytics', protect, getWorkflowAnalytics);

// Trigger routes
router.post('/triggers/create', protect, createTrigger);
router.get('/triggers', protect, getTriggers);
router.post('/triggers/fire-event', protect, fireEvent);
router.put('/triggers/:id/configure', protect, configureTrigger);
router.get('/triggers/:id/history', protect, getTriggerHistory);

export default router;
