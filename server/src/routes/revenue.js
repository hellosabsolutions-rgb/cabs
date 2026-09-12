import express from 'express';
import {
  getRevenueOverview,
  createManualRevenue,
  updateRevenue,
  deleteRevenue
} from '../controllers/revenueController.js';

const router = express.Router();

router
  .route('/')
  .get(getRevenueOverview)
  .post(createManualRevenue);

router
  .route('/:id')
  .put(updateRevenue)
  .delete(deleteRevenue);

export default router;
