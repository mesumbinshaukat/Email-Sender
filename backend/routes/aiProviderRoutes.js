import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getAIProviders,
  addAIProvider,
  updateAIProvider,
  deleteAIProvider,
  testAIProvider,
  getAvailableModels,
  setDefaultProvider
} from '../controllers/aiProviderController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all AI providers for user
router.get('/', getAIProviders);

// Add new AI provider
router.post('/', addAIProvider);

// Test AI provider connection
router.post('/test', testAIProvider);

// Get available models for a provider
router.get('/models/:provider', getAvailableModels);

// Update AI provider
router.put('/:id', updateAIProvider);

// Delete AI provider
router.delete('/:id', deleteAIProvider);

// Set default provider
router.put('/:id/set-default', setDefaultProvider);

export default router;
