import express from 'express';
import { DepartmentPayment } from '../models/DepartmentPayment.js';
import { createCrudController } from '../controllers/crudFactory.js';

const router = express.Router();
const paymentController = createCrudController(
  DepartmentPayment,
  ['receiptNumber', 'invoiceNumber', 'departmentName', 'referenceNo', 'remarks'],
  {
    mediaFields: [{ field: 'paymentProof', folder: 'fleetos/payments/proofs' }]
  }
);

router
  .route('/')
  .get(paymentController.getAll)
  .post(paymentController.create);

router
  .route('/:id')
  .get(paymentController.getById)
  .put(paymentController.update)
  .delete(paymentController.delete);

export default router;
