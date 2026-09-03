import express from 'express';
import { MonthlyBill } from '../models/MonthlyBill.js';
import { createCrudController } from '../controllers/crudFactory.js';

const router = express.Router();
const billController = createCrudController(MonthlyBill, ['billNumber', 'departmentName', 'vehicle', 'billingMonth']);

router
  .route('/')
  .get(billController.getAll)
  .post(billController.create);

router
  .route('/:id')
  .get(billController.getById)
  .put(billController.update)
  .delete(billController.delete);

export default router;
