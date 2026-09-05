import express from 'express';
import {
  getDriverExpenses,
  getDriverExpenseAnalytics,
  getDriverExpenseById,
  createDriverExpense,
  updateDriverExpense,
  updateDriverExpenseStatus,
  deleteDriverExpense
} from '../controllers/driverExpenseController.js';

const router = express.Router();

// Analytics (Monthly / Yearly / Category aggregations)
router.get('/analytics', getDriverExpenseAnalytics);

// Status update
router.patch('/:id/status', updateDriverExpenseStatus);

// Collection routes
router
  .route('/')
  .get(getDriverExpenses)
  .post(createDriverExpense);

// Single record routes
router
  .route('/:id')
  .get(getDriverExpenseById)
  .put(updateDriverExpense)
  .delete(deleteDriverExpense);

export default router;
