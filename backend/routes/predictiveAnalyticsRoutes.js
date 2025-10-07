import express from 'express';
import {
  getForecast,
  getTrends,
  getAnomalies,
  getChurnPrediction,
  getGrowthProjection
} from '../controllers/predictiveAnalyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/forecast', protect, getForecast);
router.get('/trends', protect, getTrends);
router.get('/anomalies', protect, getAnomalies);
router.get('/churn-prediction', protect, getChurnPrediction);
router.get('/growth-projection', protect, getGrowthProjection);

export default router;
