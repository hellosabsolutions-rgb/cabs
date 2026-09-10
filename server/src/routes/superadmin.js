import express from 'express';
import {
  getDashboardStats,
  getBusinesses,
  getBusinessDetail,
  updateBusinessStatus,
  getSubscriptions,
  getPayments,
  retryPayment,
  getUsers,
  getAnalytics,
  getSupport,
  getAuditLogs
} from '../controllers/superadminController.js';

const router = express.Router();

// 1. Dashboard
router.get('/dashboard/stats', getDashboardStats);

// 2. Businesses
router.get('/businesses', getBusinesses);
router.get('/businesses/:id', getBusinessDetail);
router.patch('/businesses/:id/status', updateBusinessStatus);

// 3. Subscriptions
router.get('/subscriptions', getSubscriptions);

// 4. Payments
router.get('/payments', getPayments);
router.post('/payments/retry', retryPayment);

// 5. Users
router.get('/users', getUsers);

// 6. Analytics
router.get('/analytics', getAnalytics);

// 7. Support
router.get('/support', getSupport);

// 8. Audit Logs
router.get('/audit', getAuditLogs);

export default router;
