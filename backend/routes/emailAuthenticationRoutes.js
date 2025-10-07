import express from 'express';
import {
  setupAuthentication,
  verifyAuthentication,
  getAuthentications,
  getAuthentication,
  updateRecommendation
} from '../controllers/emailAuthenticationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/setup', protect, setupAuthentication);
router.get('/', protect, getAuthentications);
router.get('/:id', protect, getAuthentication);
router.post('/:id/verify', protect, verifyAuthentication);
router.put('/:id/recommendation', protect, updateRecommendation);

export default router;
