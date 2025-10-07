import express from 'express';
import { generateResponse } from '../controllers/conversationAgentsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.post('/respond', generateResponse);

export default router;
