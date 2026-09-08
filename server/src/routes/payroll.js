import express from 'express';
import {
  getPayrollSummary,
  recordAdvance,
  recordPenalty,
  settleSalary,
  unsettleSalary,
  getDriverPayrollDetail,
  updateAdvance,
  deleteAdvance,
  updatePenalty,
  deletePenalty,
  deleteSettlement
} from '../controllers/payrollController.js';

const router = express.Router();

router.get('/summary', getPayrollSummary);
router.post('/advance', recordAdvance);
router.put('/advance/:id', updateAdvance);
router.delete('/advance/:id', deleteAdvance);

router.post('/penalty', recordPenalty);
router.put('/penalty/:id', updatePenalty);
router.delete('/penalty/:id', deletePenalty);

router.post('/settle', settleSalary);
router.post('/unsettle', unsettleSalary);
router.delete('/settlement/:id', deleteSettlement);

router.get('/driver/:driverId', getDriverPayrollDetail);

export default router;

