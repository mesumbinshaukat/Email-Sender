import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  checkAccessibility,
  getAccessibilityScore,
  suggestImprovements,
  generateAltText,
} from '../controllers/accessibilityController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/check', checkAccessibility);
router.get('/score', getAccessibilityScore);
router.post('/suggest-improvements', suggestImprovements);
router.post('/generate-alt-text', generateAltText);

export default router;
