import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  checkCompliance,
  generatePolicy,
  recordConsent,
  getAuditLog,
} from '../controllers/complianceController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/check/:type', checkCompliance);
router.post('/generate-policy', generatePolicy);
router.post('/record-consent', recordConsent);
router.get('/audit-log', getAuditLog);

export default router;
