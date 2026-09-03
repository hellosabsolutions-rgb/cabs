import express from 'express';
import { DriverExpense } from '../models/DriverExpense.js';
import { createCrudController } from '../controllers/crudFactory.js';

const router = express.Router();
const driverExpenseController = createCrudController(DriverExpense, ['driverName', 'vehicle', 'category', 'remarks']);

router
  .route('/')
  .get(driverExpenseController.getAll)
  .post(driverExpenseController.create);

router
  .route('/:id')
  .get(driverExpenseController.getById)
  .put(driverExpenseController.update)
  .delete(driverExpenseController.delete);

export default router;
