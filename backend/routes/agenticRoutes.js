import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  optimizeCampaign,
  autoGenerateSegments,
  getSegments,
  getFollowUpOpportunities,
  configureFollowUpRules,
  getBenchmarkReport,
  getCampaigns,
  createCampaign,
  getCampaign,
  updateCampaign,
  deleteCampaign,
} from '../controllers/agenticController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Campaign routes
router.route('/campaigns')
  .get(getCampaigns)
  .post(createCampaign);

router.route('/campaigns/:id')
  .get(getCampaign)
  .put(updateCampaign)
  .delete(deleteCampaign);

router.post('/campaigns/:id/optimize', optimizeCampaign);

// Segmentation routes
router.get('/segments', getSegments);
router.post('/segments/auto-generate', autoGenerateSegments);

// Follow-up routes
router.get('/follow-ups', getFollowUpOpportunities);
router.post('/follow-ups/configure', configureFollowUpRules);

// Intelligence routes
router.get('/intelligence/benchmark', getBenchmarkReport);

export default router;
