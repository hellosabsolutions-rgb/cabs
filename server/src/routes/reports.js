import express from 'express';
import {
  createReport,
  getReports,
  getReportStats,
  getReportById,
  updateReport,
  deleteReport
} from '../controllers/reportController.js';

const router = express.Router();

router.route('/')
  .post(createReport)
  .get(getReports);

router.get('/stats', getReportStats);

router.route('/:id')
  .get(getReportById)
  .patch(updateReport)
  .delete(deleteReport);

export default router;
