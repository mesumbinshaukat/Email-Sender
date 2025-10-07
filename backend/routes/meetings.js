import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  detectMeetingIntent,
  getAvailableSlots,
  scheduleMeeting,
  sendCalendarInvite,
  getCalendarSync,
  getMeetings,
} from '../controllers/meetingController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/detect-intent', detectMeetingIntent);
router.get('/available-slots', getAvailableSlots);
router.post('/schedule', scheduleMeeting);
router.post('/send-invite', sendCalendarInvite);
router.get('/calendar-sync', getCalendarSync);
router.get('/', getMeetings);

export default router;
