import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  calculateLeadScore,
  getLeadScore,
  getHotLeads,
  getSalesReadyLeads,
  getConversionProbability,
  updateLeadScore,
  getLeadAnalytics,
} from '../controllers/leadController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/calculate-score/:contactId', calculateLeadScore);
router.get('/score/:contactId', getLeadScore);
router.get('/hot-leads', getHotLeads);
router.get('/sales-ready', getSalesReadyLeads);
router.get('/conversion-probability/:contactId', getConversionProbability);
router.put('/update-score', updateLeadScore);
router.get('/analytics', getLeadAnalytics);

export default router;
