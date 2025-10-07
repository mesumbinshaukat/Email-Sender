import express from 'express';
import { predictCLV } from '../controllers/clvController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/predict/:contactId', predictCLV);

export default router;
