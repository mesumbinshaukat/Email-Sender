import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  trackClick,
  trackScroll,
  trackTime,
  trackGeographic,
  getHeatmapData,
  getScrollDepthData,
  getTimeSpentData,
  getDeviceBreakdown,
  getGeographicMap,
} from '../controllers/heatmapController.js';

const router = express.Router();

// Public tracking endpoints (no auth required for pixel tracking)
router.post('/click', trackClick);
router.post('/scroll', trackScroll);
router.post('/time', trackTime);
router.post('/geographic', trackGeographic);

// Protected analytics endpoints
router.use(protect);
router.get('/heatmap/:emailId', getHeatmapData);
router.get('/scroll-depth/:emailId', getScrollDepthData);
router.get('/time-spent/:emailId', getTimeSpentData);
router.get('/device-breakdown', getDeviceBreakdown);
router.get('/geographic-map', getGeographicMap);

export default router;
