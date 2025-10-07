import express from 'express';
import {
  initializePrivacy,
  updateGDPRCompliance,
  submitDataRequest,
  processDataRequest,
  getDataExport,
  deleteUserData,
  getPrivacyDashboard
} from '../controllers/dataPrivacyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protected routes (for account owners)
router.post('/init', protect, initializePrivacy);
router.put('/gdpr', protect, updateGDPRCompliance);
router.put('/request/:requestId/process', protect, processDataRequest);
router.get('/export', protect, getDataExport);
router.delete('/data', protect, deleteUserData);
router.get('/dashboard', protect, getPrivacyDashboard);

// Public routes (for data subjects)
router.post('/request', submitDataRequest);

export default router;
