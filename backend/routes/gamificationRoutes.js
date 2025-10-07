import express from 'express';
import {
  getGamificationProfile,
  updateGamification,
  createVoiceEmail,
  getVoiceEmails,
  getTemplates,
  createTemplate,
  purchaseTemplate,
  getAICoachInsights,
  implementInsight,
  createBlockchainVerification,
  getBlockchainVerifications,
  verifyBlockchainRecord
} from '../controllers/gamificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Gamification routes
router.get('/gamification', protect, getGamificationProfile);
router.post('/gamification/update', protect, updateGamification);

// Voice-to-Email routes
router.post('/voice-email', protect, createVoiceEmail);
router.get('/voice-email', protect, getVoiceEmails);

// Template Marketplace routes
router.get('/templates', getTemplates);
router.post('/templates', protect, createTemplate);
router.post('/templates/:id/purchase', protect, purchaseTemplate);

// AI Coach routes
router.get('/ai-coach', protect, getAICoachInsights);
router.post('/ai-coach/implement', protect, implementInsight);

// Blockchain Verification routes
router.post('/blockchain-verify', protect, createBlockchainVerification);
router.get('/blockchain-verify', protect, getBlockchainVerifications);
router.get('/blockchain-verify/:id/verify', protect, verifyBlockchainRecord);

export default router;
