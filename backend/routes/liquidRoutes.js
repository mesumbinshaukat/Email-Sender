import express from 'express';
import { personalize } from '../controllers/liquidController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.post('/personalize', personalize);

export default router;
