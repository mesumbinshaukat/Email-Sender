import express from 'express';
import {
  startTraining,
  getModels,
  getModel,
  useModel
} from '../controllers/aiTrainingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/train', protect, startTraining);
router.get('/', protect, getModels);
router.get('/:id', protect, getModel);
router.post('/:id/predict', protect, useModel);

export default router;
