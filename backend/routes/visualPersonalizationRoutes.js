import express from 'express';
import { generatePersonalizedVisual, getLiveData } from '../controllers/visualPersonalizationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.post('/generate', generatePersonalizedVisual);
router.get('/live-data/:email', getLiveData);

export default router;
