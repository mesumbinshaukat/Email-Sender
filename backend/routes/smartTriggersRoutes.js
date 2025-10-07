import express from 'express';
import {
  getTriggers,
  createSmartTrigger,
  updateTrigger,
  deleteTrigger,
  fireEvent,
  getTriggerAnalytics,
  testTrigger
} from '../controllers/smartTriggersController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getTriggers);
router.post('/smart', protect, createSmartTrigger);
router.put('/:id', protect, updateTrigger);
router.delete('/:id', protect, deleteTrigger);
router.post('/fire-event', protect, fireEvent);
router.get('/:id/analytics', protect, getTriggerAnalytics);
router.post('/:id/test', protect, testTrigger);

export default router;
