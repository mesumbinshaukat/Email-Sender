import express from 'express';
import {
  getInboxes,
  addInbox,
  startWarmup,
  getRotationRecommendation,
  updateSendCount,
  testInbox
} from '../controllers/inboxRotationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all inboxes
router.get('/', getInboxes);

// Add new inbox
router.post('/', addInbox);

// Start warmup for inbox
router.post('/:inboxId/warmup', startWarmup);

// Get rotation recommendation
router.get('/rotation/recommend', getRotationRecommendation);

// Update send count
router.put('/:inboxId/send-count', updateSendCount);

// Test inbox connection
router.get('/:inboxId/test', testInbox);

export default router;
