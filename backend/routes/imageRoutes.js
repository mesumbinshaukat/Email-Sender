import express from 'express';
import {
  generateImage,
  optimizeImage,
  generateAltText,
  abTestImages,
  getImageLibrary
} from '../controllers/imageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate', protect, generateImage);
router.post('/optimize', protect, optimizeImage);
router.post('/generate-alt-text', protect, generateAltText);
router.post('/ab-test', protect, abTestImages);
router.get('/library', protect, getImageLibrary);

export default router;
