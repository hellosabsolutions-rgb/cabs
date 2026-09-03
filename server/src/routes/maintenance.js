import express from 'express';
import { Maintenance } from '../models/Maintenance.js';
import { createCrudController } from '../controllers/crudFactory.js';

const router = express.Router();
const maintenanceController = createCrudController(Maintenance, ['vehicle', 'type', 'notes', 'dateLabel']);

router
  .route('/')
  .get(maintenanceController.getAll)
  .post(maintenanceController.create);

router
  .route('/:id')
  .get(maintenanceController.getById)
  .put(maintenanceController.update)
  .delete(maintenanceController.delete);

export default router;
