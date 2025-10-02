import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  generateEmail,
  rewriteEmail,
  optimizeSubject,
  personalizeEmail,
  predictResponse,
  getBestSendTime,
  analyzeSentiment,
  generateFollowUps,
  summarizeThread,
  extractActions,
  suggestAttachments,
  checkSpam,
  createTemplate,
  getIndustryTemplates,
  translateEmail,
  checkBrandVoice,
} from '../controllers/generativeController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Feature 1: AI Email Writer & Optimizer
router.post('/generate-email', generateEmail);
router.post('/rewrite-email', rewriteEmail);
router.post('/optimize-subject', optimizeSubject);
router.post('/personalize', personalizeEmail);

// Feature 2: Smart Email Response Predictor
router.post('/predict-response', predictResponse);
router.get('/best-send-time/:email', getBestSendTime);
router.post('/analyze-sentiment', analyzeSentiment);
router.post('/generate-follow-ups', generateFollowUps);

// Feature 3: Content Intelligence
router.post('/summarize-thread', summarizeThread);
router.post('/extract-actions', extractActions);
router.post('/suggest-attachments', suggestAttachments);
router.post('/check-spam', checkSpam);

// Feature 4: Template Generator
router.post('/create-template', createTemplate);
router.get('/templates/:industry', getIndustryTemplates);
router.post('/translate-email', translateEmail);
router.post('/check-brand-voice', checkBrandVoice);

export default router;
