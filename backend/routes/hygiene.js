import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  validateEmailList,
  cleanEmailList,
  getHygieneReport,
  reengageInactiveContacts,
} from '../controllers/hygieneController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/validate-list', validateEmailList);
router.post('/clean-list', cleanEmailList);
router.get('/report', getHygieneReport);
router.post('/re-engage-inactive', reengageInactiveContacts);

export default router;
