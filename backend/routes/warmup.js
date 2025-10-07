import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getWarmupStatus,
  startWarmup,
  getWarmupRecommendations,
  getReputationScore,
} from '../controllers/warmupController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/status', getWarmupStatus);
router.post('/start', startWarmup);
router.get('/recommendations', getWarmupRecommendations);
router.get('/reputation-score', getReputationScore);

export default router;
