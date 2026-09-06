import express from 'express';
import {
  getTransactions,
  getPerVehicleSummary,
  rechargeWallet,
  deductToll,
  updateVehicleFastagDetails,
  deleteTransaction
} from '../controllers/fastagController.js';

const router = express.Router();

// 1. Per-Vehicle summary & KPI aggregates
router.get('/per-vehicle', getPerVehicleSummary);

// 2. Specialized action endpoints
router.post('/recharge', rechargeWallet);
router.post('/deduct', deductToll);
router.put('/vehicle/:regNumber', updateVehicleFastagDetails);

// 3. Transactions listing & generic creation
router
  .route('/')
  .get(getTransactions)
  .post(deductToll);

// 4. Single transaction routes
router
  .route('/:id')
  .delete(deleteTransaction);

export default router;
