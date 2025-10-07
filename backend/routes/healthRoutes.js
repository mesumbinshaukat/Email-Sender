import express from 'express';
import { healthCheck, testEndpoints, getSystemInfo } from '../controllers/healthController.js';

const router = express.Router();

router.get('/', healthCheck);
router.get('/test-endpoints', testEndpoints);
router.get('/system', getSystemInfo);

export default router;
