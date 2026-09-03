import express from 'express';
import {
  createAgency,
  getMyAgencies,
  getAgencyById,
  updateAgency,
  switchAgency,
  deleteAgency
} from '../controllers/agencyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All agency routes require authentication

router
  .route('/')
  .post(createAgency)
  .get(getMyAgencies);

router.post('/switch/:id', switchAgency);

router
  .route('/:id')
  .get(getAgencyById)
  .put(updateAgency)
  .delete(deleteAgency);

export default router;
