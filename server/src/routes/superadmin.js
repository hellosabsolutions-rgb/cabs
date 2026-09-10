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
  getAuditLogs,
  loginSuperUser,
  inviteTeamMember,
  getTeamMembers,
  getOnboardingPipeline,
  verifyKyc,
  nudgeClient
} from '../controllers/superadminController.js';

const router = express.Router();

// 0. Internal Team Auth & Invites
router.post('/auth/login', loginSuperUser);
router.post('/auth/invite', inviteTeamMember);
router.get('/team', getTeamMembers);

// 1. Dashboard
router.get('/dashboard/stats', getDashboardStats);

// 1b. Client Onboarding Pipeline & Live DB Tracker
router.get('/onboarding', getOnboardingPipeline);
router.post('/onboarding/:id/kyc', verifyKyc);
router.post('/onboarding/:id/nudge', nudgeClient);

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

