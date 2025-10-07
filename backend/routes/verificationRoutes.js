import express from 'express';
import {
  verifyEmail,
  bulkVerifyEmails,
  getVerificationStats
} from '../controllers/verificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/verify', protect, verifyEmail);
router.post('/bulk-verify', protect, bulkVerifyEmails);
router.get('/stats', protect, getVerificationStats);

export default router;
