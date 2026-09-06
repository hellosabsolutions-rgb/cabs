import express from 'express';
import {
  getContracts,
  getContractStats,
  getContractById,
  createContract,
  updateContract,
  updateContractStatus,
  deleteContract
} from '../controllers/contractController.js';

const router = express.Router();

// Contract summary stats
router.get('/stats', getContractStats);

// Base CRUD routes
router
  .route('/')
  .get(getContracts)
  .post(createContract);

// Status update quick endpoint
router.patch('/:id/status', updateContractStatus);

// Single contract routes
router
  .route('/:id')
  .get(getContractById)
  .put(updateContract)
  .delete(deleteContract);

export default router;
