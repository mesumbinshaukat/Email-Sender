import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  scheduleEmail,
  getOptimalTimes,
  rescheduleEmail,
  getQueue,
} from '../controllers/schedulerController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// POST /api/scheduler/schedule-email - Schedule email with AI optimal time
router.post('/schedule-email', scheduleEmail);

// GET /api/scheduler/optimal-times/:recipientEmail - Get AI-recommended send times
router.get('/optimal-times/:recipientEmail', getOptimalTimes);

// PUT /api/scheduler/reschedule/:emailId - Reschedule a queued email
router.put('/reschedule/:emailId', rescheduleEmail);

// GET /api/scheduler/queue - Get user's email queue
router.get('/queue', getQueue);

export default router;
