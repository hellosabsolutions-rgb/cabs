import express from 'express';
import { FuelLog } from '../models/FuelLog.js';
import { createCrudController } from '../controllers/crudFactory.js';
import { protectUserOrDriver } from '../middleware/authMiddleware.js';
import { resolveAgency } from '../middleware/resolveAgency.js';

const router = express.Router();

router.use(protectUserOrDriver);
router.use(resolveAgency);
const fuelLogController = createCrudController(FuelLog, ['vehicle', 'driverName', 'stationName', 'fuelType', 'location', 'notes']);

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
