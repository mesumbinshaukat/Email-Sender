import express from 'express';
import {
  getSmtpConfig,
  updateSmtpConfig,
  testSmtpConfig,
  deleteSmtpConfig,
} from '../controllers/smtpController.js';
import { protect } from '../middleware/auth.js';
import { smtpValidation, validateRequest } from '../middleware/validators.js';

const router = express.Router();

router.get('/', protect, getSmtpConfig);
router.put('/', protect, smtpValidation, validateRequest, updateSmtpConfig);
router.post('/test', protect, smtpValidation, validateRequest, testSmtpConfig);
router.delete('/', protect, deleteSmtpConfig);

export default router;
