import express from 'express';
import {
  createCohort,
  getCohorts,
  analyzeCohort,
  updateCohortMetrics
} from '../controllers/cohortController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', protect, createCohort);
router.get('/', protect, getCohorts);
router.get('/:id/analysis', protect, analyzeCohort);
router.put('/:id/metrics', protect, updateCohortMetrics);

export default router;
