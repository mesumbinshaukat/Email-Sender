import express from 'express';
import {
  suggestEmojis,
  checkAppropriateness,
  getTrendingEmojis,
  getEmojiPerformance,
  abTestEmojis
} from '../controllers/emojiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/suggest', protect, suggestEmojis);
router.post('/check-appropriateness', protect, checkAppropriateness);
router.get('/trending', protect, getTrendingEmojis);
router.get('/performance-analytics', protect, getEmojiPerformance);
router.post('/ab-test', protect, abTestEmojis);

export default router;
