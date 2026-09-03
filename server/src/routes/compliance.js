import express from 'express';
import { Compliance } from '../models/Compliance.js';
import { createCrudController } from '../controllers/crudFactory.js';

const router = express.Router();
const complianceController = createCrudController(Compliance, [
  'entityName',
  'documentName',
  'documentNumber',
  'issuingAuthority'
]);

router
  .route('/')
  .get(complianceController.getAll)
  .post(complianceController.create);

router
  .route('/:id')
  .get(complianceController.getById)
  .put(complianceController.update)
  .delete(complianceController.delete);

export default router;
