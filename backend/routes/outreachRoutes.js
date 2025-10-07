import express from 'express';
import {
  createOutreachCampaign,
  startOutreachCampaign,
  getOutreachAnalytics
} from '../controllers/outreachController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', protect, createOutreachCampaign);
router.post('/:id/start', protect, startOutreachCampaign);
router.get('/analytics', protect, getOutreachAnalytics);

export default router;
