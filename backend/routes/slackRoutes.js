import express from 'express';
import {
  sendSlackNotification,
  handleSlackCommand,
  sendDailyDigest
} from '../controllers/slackController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/notify', protect, sendSlackNotification);
router.post('/commands', handleSlackCommand);
router.post('/daily-digest', protect, sendDailyDigest);

export default router;
