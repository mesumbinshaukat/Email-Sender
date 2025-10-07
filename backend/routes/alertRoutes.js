import express from 'express';
import {
  createAlert,
  getAlerts,
  updateAlertStatus,
  triggerAlert,
  sendTestAlert
} from '../controllers/alertController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', protect, createAlert);
router.get('/', protect, getAlerts);
router.put('/:id/status', protect, updateAlertStatus);
router.post('/trigger', protect, triggerAlert);
router.post('/test', protect, sendTestAlert);

export default router;
