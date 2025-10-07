import express from 'express';
import {
  startOptimization,
  getOptimization,
  getOptimizations,
  applyOptimization,
  getOptimizationInsights
} from '../controllers/sendTimeOptimizationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/start', protect, startOptimization);
router.get('/', protect, getOptimizations);
router.get('/:id', protect, getOptimization);
router.post('/:id/apply', protect, applyOptimization);
router.get('/:id/insights', protect, getOptimizationInsights);

export default router;
