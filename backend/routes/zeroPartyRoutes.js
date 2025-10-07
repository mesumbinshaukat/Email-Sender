import express from 'express';
import { collectData, enrichProfile } from '../controllers/zeroPartyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.post('/collect', collectData);
router.post('/enrich', enrichProfile);

export default router;
