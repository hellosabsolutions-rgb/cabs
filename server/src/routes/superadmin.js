import express from 'express';
import { protectSuperadmin } from '../middleware/authMiddleware.js';
import {
  superadminLogin,
  superadminMe,
  getDashboard,
  onboardOrganization,
  listOrganizations,
  getOrganization,
  updateOrganization,
  listProjects,
  createProject,
  updateProject,
  listTrackedUsers,
  updateTrackedUser
} from '../controllers/superadminController.js';
import {
  listLeads,
  createLead,
  updateLead,
  convertLead,
  listEvents,
  getLeadFunnel,
  listPlans,
  upsertPlan,
  deletePlan,
  listSubscriptions,
  assignSubscription,
  updateSubscription,
  seedDefaultPlans,
  exportReport
} from '../controllers/platformOpsController.js';

const router = express.Router();
const sa = protectSuperadmin;

router.post('/auth/login', superadminLogin);

router.get('/auth/me', ...sa, superadminMe);
router.get('/dashboard', ...sa, getDashboard);

router.get('/organizations', ...sa, listOrganizations);
router.post('/organizations/onboard', ...sa, onboardOrganization);
router.get('/organizations/:id', ...sa, getOrganization);
router.patch('/organizations/:id', ...sa, updateOrganization);

router.get('/projects', ...sa, listProjects);
router.post('/projects', ...sa, createProject);
router.patch('/projects/:id', ...sa, updateProject);

router.get('/users', ...sa, listTrackedUsers);
router.patch('/users/:id', ...sa, updateTrackedUser);

// Leads + activity
router.get('/leads', ...sa, listLeads);
router.post('/leads', ...sa, createLead);
router.patch('/leads/:id', ...sa, updateLead);
router.post('/leads/:id/convert', ...sa, convertLead);
router.get('/events', ...sa, listEvents);
router.get('/funnel', ...sa, getLeadFunnel);

// Subscriptions (superadmin-only, not connected to admin yet)
router.get('/plans', ...sa, listPlans);
router.post('/plans', ...sa, upsertPlan);
router.put('/plans/:id', ...sa, (req, res, next) => {
  req.body = { ...req.body, id: req.params.id };
  return upsertPlan(req, res, next);
});
router.delete('/plans/:id', ...sa, deletePlan);
router.post('/plans/seed-defaults', ...sa, seedDefaultPlans);
router.get('/subscriptions', ...sa, listSubscriptions);
router.post('/subscriptions', ...sa, assignSubscription);
router.patch('/subscriptions/:id', ...sa, updateSubscription);

// Exports
router.get('/export', ...sa, exportReport);

export default router;
