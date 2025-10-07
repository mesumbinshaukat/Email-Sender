import express from 'express';
import {
  trackTouchpoint,
  recordConversion,
  getAttributionReport,
  getCustomerJourney
} from '../controllers/attributionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/track', protect, trackTouchpoint);
router.post('/conversion', protect, recordConversion);
router.get('/report', protect, getAttributionReport);
router.get('/journey/:contactId', protect, getCustomerJourney);

export default router;
