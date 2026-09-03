import express from 'express';
import { DriverAttendance } from '../models/DriverAttendance.js';
import { createCrudController } from '../controllers/crudFactory.js';

const router = express.Router();
const attendanceController = createCrudController(DriverAttendance, ['driverName', 'assignedVehicle', 'date']);

router
  .route('/')
  .get(attendanceController.getAll)
  .post(attendanceController.create);

router
  .route('/:id')
  .get(attendanceController.getById)
  .put(attendanceController.update)
  .delete(attendanceController.delete);

export default router;
