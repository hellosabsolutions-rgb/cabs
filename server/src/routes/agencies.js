import express from 'express';
import {
  createAgency,
  getMyAgencies,
  getAgencyById,
  updateAgency,
  switchAgency,
  deleteAgency,
  getAgencyStaff,
  inviteAgencyStaff,
  revokeStaffInvitation,
  removeAgencyStaff
} from '../controllers/agencyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All agency routes require authentication

router
  .route('/')
  .post(createAgency)
  .get(getMyAgencies);

router.post('/switch/:id', switchAgency);

// Staff management and invitations
router.get('/:id/staff', getAgencyStaff);
router.post('/:id/invite', inviteAgencyStaff);
router.delete('/:id/invite/:inviteId', revokeStaffInvitation);
router.delete('/:id/staff/:userId', removeAgencyStaff);

router
  .route('/:id')
  .get(getAgencyById)
  .put(updateAgency)
  .delete(deleteAgency);

export default router;
