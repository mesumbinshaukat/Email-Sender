import express from 'express';
import {
  createTeam,
  getTeams,
  getTeam,
  inviteMember,
  updateMemberRole,
  removeMember
} from '../controllers/teamController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createTeam);
router.get('/', protect, getTeams);
router.get('/:id', protect, getTeam);
router.post('/:id/invite', protect, inviteMember);
router.put('/:id/members/:memberId', protect, updateMemberRole);
router.delete('/:id/members/:memberId', protect, removeMember);

export default router;
