import express from 'express';
import {
  getAllAssignments,
  getActiveAssignments,
  getDriverHistory,
  getVehicleHistory,
  createAssignment,
  endAssignment
} from '../controllers/driverAssignmentController.js';

const router = express.Router();

router
  .route('/')
  .get(getAllAssignments)
  .post(createAssignment);

router
  .route('/active')
  .get(getActiveAssignments);

router
  .route('/driver/:driverId')
  .get(getDriverHistory);

router
  .route('/vehicle/:registration')
  .get(getVehicleHistory);

router
  .route('/:id/end')
  .post(endAssignment);

export default router;
