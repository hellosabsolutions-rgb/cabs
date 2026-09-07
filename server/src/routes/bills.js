import express from 'express';
import {
  getBills,
  getBillStats,
  getBillById,
  createBill,
  updateBill,
  updateBillStatus,
  applyGstBulk,
  generateWeekendBillFromLog,
  deleteBill
} from '../controllers/billController.js';

const router = express.Router();

// Summary stats & bulk GST action
router.get('/stats', getBillStats);
router.post('/apply-gst', applyGstBulk);
router.post('/weekend-memo', generateWeekendBillFromLog);

// Base collection routes
router
  .route('/')
  .get(getBills)
  .post(createBill);

// Quick status update routes (supports both PATCH and PUT)
router.patch('/:id/status', updateBillStatus);
router.put('/:id/status', updateBillStatus);

// Single bill routes
router
  .route('/:id')
  .get(getBillById)
  .put(updateBill)
  .delete(deleteBill);

export default router;
