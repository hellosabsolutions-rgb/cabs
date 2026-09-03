import express from 'express';
import { Driver } from '../models/Driver.js';
import { createCrudController } from '../controllers/crudFactory.js';

const router = express.Router();
const driverController = createCrudController(Driver, ['name', 'phone', 'assignedVehicle', 'licenseNumber']);

router
  .route('/')
  .get(driverController.getAll)
  .post(driverController.create);

router
  .route('/:id')
  .get(driverController.getById)
  .put(driverController.update)
  .delete(driverController.delete);

export default router;
