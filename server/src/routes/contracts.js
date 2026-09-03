import express from 'express';
import { DepartmentContract } from '../models/DepartmentContract.js';
import { createCrudController } from '../controllers/crudFactory.js';

const router = express.Router();
const contractController = createCrudController(DepartmentContract, [
  'contractNumber',
  'departmentName',
  'contactPerson',
  'vehicle',
  'driverName'
]);

router
  .route('/')
  .get(contractController.getAll)
  .post(contractController.create);

router
  .route('/:id')
  .get(contractController.getById)
  .put(contractController.update)
  .delete(contractController.delete);

export default router;
