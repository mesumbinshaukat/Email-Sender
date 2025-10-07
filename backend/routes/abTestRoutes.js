import express from 'express';
import {
  createABTest,
  getABTests,
  startABTest,
  updateTestResults,
  analyzeTest,
  declareWinner
} from '../controllers/abTestController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', protect, createABTest);
router.get('/', protect, getABTests);
router.post('/:id/start', protect, startABTest);
router.put('/:id/results', protect, updateTestResults);
router.get('/:id/analysis', protect, analyzeTest);
router.post('/:id/declare-winner', protect, declareWinner);

export default router;
