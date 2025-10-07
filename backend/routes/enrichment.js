import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  enrichContact,
  getContactIcebreakers,
  getCompanyNews,
  generateTalkingPoints,
} from '../controllers/enrichmentController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/contact/:email', enrichContact);
router.get('/icebreakers/:email', getContactIcebreakers);
router.get('/company-news/:domain', getCompanyNews);
router.post('/talking-points', generateTalkingPoints);

export default router;
