import express from 'express';
import {
  getDutyLogs,
  createDutyLog,
  getDutyLogById,
  updateDutyLog,
  deleteDutyLog
} from '../controllers/dutyLogController.js';

const router = express.Router();

router.route('/').get(getDutyLogs).post(createDutyLog);

router
  .route('/:id')
  .get(getDutyLogById)
  .put(updateDutyLog)
  .delete(deleteDutyLog);

export default router;
