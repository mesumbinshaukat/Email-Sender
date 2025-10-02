import express from 'express';
import {
  trackEmailOpen,
  trackEmailClick,
  trackReadTime,
  getTrackingData,
} from '../controllers/trackingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no auth required for tracking)
router.get('/open/:trackingId', trackEmailOpen);
router.get('/click/:trackingId', trackEmailClick);
router.post('/readtime/:trackingId', trackReadTime);

// Private route (requires auth)
router.get('/data/:trackingId', protect, getTrackingData);

export default router;
