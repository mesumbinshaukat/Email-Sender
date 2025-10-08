import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getEnvironmentVariables,
  getVariableStatus,
  setEnvironmentVariable,
  updateEnvironmentVariable,
  deleteEnvironmentVariable,
  testAPIKey
} from '../controllers/envController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all environment variables
router.get('/', getEnvironmentVariables);

// Get specific variable status
router.get('/:key/status', getVariableStatus);

// Set environment variable
router.post('/', setEnvironmentVariable);

// Update environment variable
router.put('/:key', updateEnvironmentVariable);

// Delete environment variable
router.delete('/:key', deleteEnvironmentVariable);

// Test API key
router.post('/test/:service', testAPIKey);

export default router;
