import express from 'express';
import { generateAMPEmail } from '../controllers/ampController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.post('/generate', generateAMPEmail);

export default router;
