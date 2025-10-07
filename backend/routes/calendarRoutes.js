import express from 'express';
import {
  connectCalendar,
  getCalendarIntegrations,
  scheduleMeeting,
  getUpcomingEvents,
  syncCalendar
} from '../controllers/calendarController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/connect', protect, connectCalendar);
router.get('/integrations', protect, getCalendarIntegrations);
router.post('/schedule-meeting', protect, scheduleMeeting);
router.get('/:id/events', protect, getUpcomingEvents);
router.post('/:id/sync', protect, syncCalendar);

export default router;
