import express from 'express';
import {
  createNewsletter,
  sendNewsletter,
  getSubscriberStats
} from '../controllers/newsletterController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', protect, createNewsletter);
router.post('/:id/send', protect, sendNewsletter);
router.get('/subscribers', protect, getSubscriberStats);

export default router;
