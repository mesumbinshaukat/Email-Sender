import express from 'express';
import {
  generateTemplate,
  getTemplates,
  customizeTemplate,
  previewTemplate,
  saveBrandKit,
  getBrandKits
} from '../controllers/designController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate-template', protect, generateTemplate);
router.get('/templates', protect, getTemplates);
router.post('/customize', protect, customizeTemplate);
router.get('/preview/:id', protect, previewTemplate);
router.post('/save-brand-kit', protect, saveBrandKit);
router.get('/brand-kits', protect, getBrandKits);

export default router;
