import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  addCompetitor,
  getCompetitors,
  getCompetitorInsights,
  getIndustryBenchmarks,
  getCompetitorTrends,
  updateCompetitorSettings,
  removeCompetitor,
} from '../controllers/competitorController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/add', addCompetitor);
router.get('/', getCompetitors);
router.get('/:id/insights', getCompetitorInsights);
router.get('/benchmarks', getIndustryBenchmarks);
router.get('/trends', getCompetitorTrends);
router.put('/:id/settings', updateCompetitorSettings);
router.delete('/:id', removeCompetitor);

export default router;
