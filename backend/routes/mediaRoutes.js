import express from 'express';
import {
  getGifs,
  uploadVideo,
  generateThumbnail,
  getVideoAnalytics,
  generateFallback
} from '../controllers/mediaController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/gifs', protect, getGifs);
router.post('/upload-video', protect, uploadVideo);
router.post('/generate-thumbnail', protect, generateThumbnail);
router.get('/video-analytics/:videoId', protect, getVideoAnalytics);
router.post('/generate-fallback', protect, generateFallback);

export default router;
