import express from 'express';
import { FastagTransaction } from '../models/FastagTransaction.js';
import { createCrudController } from '../controllers/crudFactory.js';

const router = express.Router();
const fastagController = createCrudController(FastagTransaction, [
  'vehicle',
  'tagId',
  'tollPlaza',
  'transactionRef',
  'linkedDutyOrTrip'
]);

router
  .route('/')
  .get(fastagController.getAll)
  .post(fastagController.create);

router
  .route('/:id')
  .get(fastagController.getById)
  .put(fastagController.update)
  .delete(fastagController.delete);

export default router;
