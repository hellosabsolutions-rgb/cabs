import express from 'express';
import {
  getDriverExpenses,
  getDriverExpenseAnalytics,
  getDriverExpenseById,
  createDriverExpense,
  updateDriverExpense,
  updateDriverExpenseStatus,
  bulkUpdateDriverExpenseStatus,
  deleteDriverExpense
} from '../controllers/driverExpenseController.js';
import { protectUserOrDriver } from '../middleware/authMiddleware.js';
import { resolveAgency } from '../middleware/resolveAgency.js';

const router = express.Router();

router.use(protectUserOrDriver);
router.use(resolveAgency);

router.get('/analytics', getDriverExpenseAnalytics);
router.patch('/bulk-status', bulkUpdateDriverExpenseStatus);
router.patch('/:id/status', updateDriverExpenseStatus);

router.route('/').get(getDriverExpenses).post(createDriverExpense);

router
  .route('/:id')
  .get(getDriverExpenseById)
  .put(updateDriverExpense)
  .delete(deleteDriverExpense);

export default router;
