import express from 'express';
import { DailyDutyLog } from '../models/DailyDutyLog.js';
import { createCrudController } from '../controllers/crudFactory.js';

const router = express.Router();
const dutyLogController = createCrudController(DailyDutyLog, [
  'dutySlipNumber',
  'departmentName',
  'vehicle',
  'driverName',
  'officerName',
  'tripDestination'
]);

router
  .route('/')
  .get(dutyLogController.getAll)
  .post(dutyLogController.create);

router
  .route('/:id')
  .get(dutyLogController.getById)
  .put(dutyLogController.update)
  .delete(dutyLogController.delete);

export default router;
