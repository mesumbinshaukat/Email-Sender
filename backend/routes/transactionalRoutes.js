import express from 'express';
import {
  sendTransactionalEmail,
  getTransactionalStats,
  configureSMTP
} from '../controllers/transactionalController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/send', protect, sendTransactionalEmail);
router.get('/stats', protect, getTransactionalStats);
router.post('/smtp-config', protect, configureSMTP);

export default router;
