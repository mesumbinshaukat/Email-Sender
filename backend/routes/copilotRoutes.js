import express from 'express';
import {
  getSuggestions,
  checkGrammar,
  analyzeTone,
  getReadabilityScore,
  improveSentence
} from '../controllers/copilotController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/suggest', protect, getSuggestions);
router.post('/check-grammar', protect, checkGrammar);
router.post('/analyze-tone', protect, analyzeTone);
router.get('/readability-score', protect, getReadabilityScore);
router.post('/improve-sentence', protect, improveSentence);

export default router;
