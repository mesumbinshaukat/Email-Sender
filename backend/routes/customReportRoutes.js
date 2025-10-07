import express from 'express';
import {
  createReport,
  getReports,
  generateReport,
  getReportData,
  updateReport,
  deleteReport,
  getDashboardMetrics
} from '../controllers/customReportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', protect, getDashboardMetrics);
router.post('/', protect, createReport);
router.get('/', protect, getReports);
router.post('/:id/generate', protect, generateReport);
router.get('/:id/data', protect, getReportData);
router.put('/:id', protect, updateReport);
router.delete('/:id', protect, deleteReport);

export default router;
