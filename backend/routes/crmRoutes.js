import express from 'express';
import {
  connectCRM,
  getCRMIntegrations,
  syncCRM,
  getSyncStatus,
  disconnectCRM
} from '../controllers/crmController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/connect', protect, connectCRM);
router.get('/integrations', protect, getCRMIntegrations);
router.post('/:id/sync', protect, syncCRM);
router.get('/:id/status', protect, getSyncStatus);
router.delete('/:id', protect, disconnectCRM);

export default router;
