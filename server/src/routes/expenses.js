import express from 'express';
import { Expense } from '../models/Expense.js';
import { createCrudController } from '../controllers/crudFactory.js';

const router = express.Router();
const expenseController = createCrudController(Expense, ['vehicle', 'category', 'linkedTo']);

router
  .route('/')
  .get(expenseController.getAll)
  .post(expenseController.create);

router
  .route('/:id')
  .get(expenseController.getById)
  .put(expenseController.update)
  .delete(expenseController.delete);

export default router;
