import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  predictPerformance,
  getPredictionHistory,
  getPredictionAccuracy,
  updatePrediction,
  getPredictionInsights,
  savePrediction,
} from '../controllers/predictorController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Performance prediction
router.post('/performance', predictPerformance);
router.post('/save', savePrediction);
router.get('/history/:emailId', getPredictionHistory);
router.get('/accuracy', getPredictionAccuracy);
router.post('/update/:predictionId', updatePrediction);
router.get('/insights', getPredictionInsights);

export default router;
