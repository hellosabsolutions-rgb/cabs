import express from 'express';
import {
  getAllMaintenance,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance
} from '../controllers/maintenanceController.js';

const router = express.Router();

router
  .route('/')
  .get(getAllMaintenance)
  .post(createMaintenance);

router
  .route('/:id')
  .get(getMaintenanceById)
  .put(updateMaintenance)
  .delete(deleteMaintenance);

export default router;
