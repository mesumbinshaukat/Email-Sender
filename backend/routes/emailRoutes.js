import express from 'express';
import {
  sendEmail,
  getEmails,
  getEmailById,
  getEmailStats,
  deleteEmail,
} from '../controllers/emailController.js';
import { protect } from '../middleware/auth.js';
import { emailValidation, validateRequest } from '../middleware/validators.js';

const router = express.Router();

router.post('/send', protect, emailValidation, validateRequest, sendEmail);
router.get('/', protect, getEmails);
router.get('/analytics/stats', protect, getEmailStats);
router.get('/:id', protect, getEmailById);
router.delete('/:id', protect, deleteEmail);

export default router;
