import express from 'express';
import {
  getEnvVars,
  setEnvVarHandler,
  updateEnvVar,
  deleteEnvVar,
  getEnvVarsByCategory
} from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);

router.get('/env-vars', getEnvVars);
router.post('/env-vars', setEnvVarHandler);
router.put('/env-vars/:key', updateEnvVar);
router.delete('/env-vars/:key', deleteEnvVar);
router.get('/env-vars/category/:category', getEnvVarsByCategory);

export default router;
