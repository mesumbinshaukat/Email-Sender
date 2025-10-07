import express from 'express';
import { optimizeWaves } from '../controllers/staggeredSendController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.post('/optimize', optimizeWaves);

export default router;
