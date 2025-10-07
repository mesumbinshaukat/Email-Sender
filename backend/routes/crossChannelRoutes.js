import express from 'express';
import { adaptJourney } from '../controllers/crossChannelController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.post('/adapt', adaptJourney);

export default router;
