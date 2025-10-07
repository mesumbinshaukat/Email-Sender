import express from 'express';
import { designWorkflow } from '../controllers/goalAutomationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.post('/design', designWorkflow);

export default router;
