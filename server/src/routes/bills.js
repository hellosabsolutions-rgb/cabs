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
  previewMonthlyBill,
  generateMonthlyBill,
  unlockBill,
  deleteBill
} from '../controllers/billController.js';

const router = express.Router();

// Summary stats & bulk GST action
router.get('/stats', getBillStats);
router.post('/apply-gst', applyGstBulk);
router.post('/weekend-memo', generateWeekendBillFromLog);
router.post('/preview-monthly', previewMonthlyBill);
router.post('/generate-monthly', generateMonthlyBill);

// Base collection routes
router
  .route('/')
  .get(getBills)
  .post(createBill);

// Quick status update routes (supports both PATCH and PUT)
router.patch('/:id/status', updateBillStatus);
router.put('/:id/status', updateBillStatus);
router.post('/:id/unlock', unlockBill);

// Single bill routes
router
  .route('/:id')
  .get(getBillById)
  .put(updateBill)
  .delete(deleteBill);

export default router;
