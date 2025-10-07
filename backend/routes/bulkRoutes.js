import express from 'express';
import {
  uploadCSV,
  personalizeBulk,
  previewPersonalized,
  sendBulkEmails,
  getBulkStatus,
  getBulkJobs
} from '../controllers/bulkController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/upload-csv', protect, uploadCSV);
router.post('/personalize', protect, personalizeBulk);
router.post('/preview/:contactId', protect, previewPersonalized);
router.post('/send', protect, sendBulkEmails);
router.get('/status/:batchId', protect, getBulkStatus);
router.get('/jobs', protect, getBulkJobs);

export default router;
