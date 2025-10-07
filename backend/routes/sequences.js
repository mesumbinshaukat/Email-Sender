import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createSequence,
  getSequences,
  getSequence,
  updateSequence,
  deleteSequence,
  addSequenceStep,
  generateSequenceContent,
  getSequenceAnalytics,
  startSequence,
} from '../controllers/sequenceController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Sequence CRUD routes
router.route('/')
  .post(createSequence)
  .get(getSequences);

router.route('/:id')
  .get(getSequence)
  .put(updateSequence)
  .delete(deleteSequence);

// Sequence actions
router.post('/:id/steps', addSequenceStep);
router.post('/:id/generate-content', generateSequenceContent);
router.get('/:id/analytics', getSequenceAnalytics);
router.post('/:id/start', startSequence);

export default router;
