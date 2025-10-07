import express from 'express';
import {
  createWebhook,
  getWebhooks,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  triggerWebhook,
  getApiDocs
} from '../controllers/webhookController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/docs', protect, getApiDocs);
router.post('/', protect, createWebhook);
router.get('/', protect, getWebhooks);
router.put('/:id', protect, updateWebhook);
router.delete('/:id', protect, deleteWebhook);
router.post('/:id/test', protect, testWebhook);
router.post('/trigger', protect, triggerWebhook); // Internal use

export default router;
