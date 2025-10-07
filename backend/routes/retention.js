import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  detectUnsubscribeSignal,
  getAtRiskContacts,
  triggerRetentionCampaign,
  getContactPreferences,
  updateContactPreferences,
  generateWinBackOffer,
  getRetentionAnalytics,
} from '../controllers/retentionController.js';

const router = express.Router();

// All routes require authentication except preference updates (can use token)
router.use(protect);

router.post('/detect-signal', detectUnsubscribeSignal);
router.get('/at-risk-contacts', getAtRiskContacts);
router.post('/trigger-campaign/:contactId', triggerRetentionCampaign);
router.get('/preferences/:contactId', getContactPreferences);
router.put('/update-preferences', updateContactPreferences);
router.post('/win-back-offer', generateWinBackOffer);
router.get('/analytics', getRetentionAnalytics);

export default router;
