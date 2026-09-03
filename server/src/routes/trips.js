import express from 'express';
import { Trip } from '../models/Trip.js';
import { createCrudController } from '../controllers/crudFactory.js';

const router = express.Router();
const tripController = createCrudController(Trip, [
  'tripNumber',
  'vehicle',
  'driverName',
  'pickupLocation',
  'dropLocation',
  'route',
  'customerName'
]);

router
  .route('/')
  .get(tripController.getAll)
  .post(tripController.create);

router
  .route('/:id')
  .get(tripController.getById)
  .put(tripController.update)
  .delete(tripController.delete);

export default router;
