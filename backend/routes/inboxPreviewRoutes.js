import express from 'express';
import {
  generatePreview,
  getPreview,
  getPreviewById,
  getPreviews,
  regeneratePreview
} from '../controllers/inboxPreviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate', protect, generatePreview);
router.get('/', protect, getPreviews);
router.get('/preview/:id', protect, getPreviewById);
router.get('/:emailId', protect, getPreview);
router.post('/:id/regenerate', protect, regeneratePreview);

export default router;
