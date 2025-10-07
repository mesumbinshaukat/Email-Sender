import express from 'express';
import {
  getWhiteLabelSettings,
  updateBranding,
  updateDomain,
  updateEmailSettings,
  updateSubscription,
  verifyDomain,
  getCustomCSS
} from '../controllers/whiteLabelController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getWhiteLabelSettings);
router.put('/branding', protect, updateBranding);
router.put('/domain', protect, updateDomain);
router.put('/email', protect, updateEmailSettings);
router.put('/subscription', protect, updateSubscription);
router.post('/verify-domain', protect, verifyDomain);
router.get('/css', getCustomCSS);

export default router;
