import express from 'express';
import {
  connectEcommerce,
  getEcommerceIntegrations,
  syncEcommerce,
  handleWebhook
} from '../controllers/ecommerceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/connect', protect, connectEcommerce);
router.get('/integrations', protect, getEcommerceIntegrations);
router.post('/:id/sync', protect, syncEcommerce);
router.post('/webhook/:platform', handleWebhook);

export default router;
