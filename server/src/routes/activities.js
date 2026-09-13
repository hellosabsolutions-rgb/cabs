import express from 'express';
import {
  getActivities,
  getUserStats,
  createActivity
} from '../controllers/activityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getActivities)
  .post(createActivity);

router.get('/users-stats', getUserStats);

export default router;
