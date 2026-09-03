import express from 'express';
import { vehicleController } from '../controllers/vehicleController.js';

const router = express.Router();

router
  .route('/')
  .get(vehicleController.getAll)
  .post(vehicleController.create);

router
  .route('/:id')
  .get(vehicleController.getById)
  .put(vehicleController.update)
  .delete(vehicleController.delete);

export default router;
