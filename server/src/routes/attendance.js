import express from 'express';
import {
  getAttendance,
  getAttendanceSummary,
  getAttendanceAnalytics,
  getAttendanceById,
  markAttendance,
  bulkMarkAttendance,
  updateAttendanceStatus,
  updateAttendance,
  deleteAttendance
} from '../controllers/attendanceController.js';

const router = express.Router();

// Summary stats for a date
router.get('/summary', getAttendanceSummary);

// Monthly & Yearly Analytics
router.get('/analytics', getAttendanceAnalytics);

// Bulk operations
router.post('/bulk', bulkMarkAttendance);

// Specific status toggle
router.patch('/:id/status', updateAttendanceStatus);

// Core collection routes
router
  .route('/')
  .get(getAttendance)
  .post(markAttendance);

// Single record routes
router
  .route('/:id')
  .get(getAttendanceById)
  .put(updateAttendance)
  .delete(deleteAttendance);

export default router;
