import express from 'express';
import {
  getComplianceDocs,
  getComplianceExpiry,
  createComplianceDoc,
  updateComplianceDoc,
  deleteComplianceDoc
} from '../controllers/complianceController.js';

const router = express.Router();

// Real-time calculated Expiry alerts, vehicle & driver breakdowns
router.get('/expiry', getComplianceExpiry);
router.get('/alerts', getComplianceExpiry);

// General compliance endpoints
router
  .route('/')
  .get(getComplianceDocs)
  .post(createComplianceDoc);

router
  .route('/:id')
  .put(updateComplianceDoc)
  .delete(deleteComplianceDoc);

export default router;
