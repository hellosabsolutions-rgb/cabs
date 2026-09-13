import express from 'express';
import {
  listTripExpenses,
  createTripExpense,
  updateTripExpense,
  updateTripExpenseStatus,
  bulkUpdateTripExpenseStatus,
  deleteTripExpense
} from '../controllers/tripExpenseController.js';
import { protectUserOrDriver } from '../middleware/authMiddleware.js';
import { resolveAgency } from '../middleware/resolveAgency.js';

const router = express.Router();

router.use(protectUserOrDriver);
router.use(resolveAgency);

router.route('/').get(listTripExpenses).post(createTripExpense);
router.patch('/bulk-status', bulkUpdateTripExpenseStatus);
router.patch('/:id/status', updateTripExpenseStatus);
router.route('/:id').put(updateTripExpense).delete(deleteTripExpense);

export default router;
