import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  analyzeReply,
  getSmartInbox,
  suggestResponse,
  categorizeReply,
  getHotLeads,
} from '../controllers/replyController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/analyze', analyzeReply);
router.get('/inbox', getSmartInbox);
router.post('/suggest-response', suggestResponse);
router.put('/:id/categorize', categorizeReply);
router.get('/hot-leads', getHotLeads);

export default router;
