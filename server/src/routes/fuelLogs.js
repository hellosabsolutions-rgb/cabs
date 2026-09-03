import express from 'express';
import { FuelLog } from '../models/FuelLog.js';
import { createCrudController } from '../controllers/crudFactory.js';

const router = express.Router();
const fuelLogController = createCrudController(FuelLog, ['vehicle', 'driverName', 'stationName', 'fuelType', 'notes']);

router
  .route('/')
  .get(fuelLogController.getAll)
  .post(fuelLogController.create);

router
  .route('/:id')
  .get(fuelLogController.getById)
  .put(fuelLogController.update)
  .delete(fuelLogController.delete);

export default router;
