import express from 'express';
import { driverController } from '../controllers/driverController.js';

const router = express.Router();

router
  .route('/')
  .get(driverController.getAll)
  .post(driverController.create);

router
  .route('/:id')
  .get(driverController.getById)
  .put(driverController.update)
  .delete(driverController.delete);

router
  .route('/:id/status')
  .patch(driverController.updateStatus);

export default router;
