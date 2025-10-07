import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  trackConversion,
  getRevenueAttribution,
  getROI,
  getCustomerLTV,
  getRevenueForecast,
} from '../controllers/revenueController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/track-conversion', trackConversion);
router.get('/attribution/:campaignId', getRevenueAttribution);
router.get('/roi', getROI);
router.get('/ltv/:contactId', getCustomerLTV);
router.get('/forecast', getRevenueForecast);

export default router;
