import express from 'express';
import {
  getAllBookings,
  getMyBookings,
  getBookingById,
  createBooking,
  updateBooking,
  updateBookingStatus,
  assignBookingDriver,
  completeBooking,
  recordPayment,
  checkAvailability,
  deleteBooking
} from '../controllers/bookingController.js';
import { protect, protectDriver } from '../middleware/authMiddleware.js';
import { resolveAgency } from '../middleware/resolveAgency.js';

const router = express.Router();

// Driver app route (must be before tenant middleware)
router.get('/my', protectDriver, resolveAgency, getMyBookings);

// Admin / dashboard routes — require user login + active agency
router.use(protect, resolveAgency);

router.get('/availability', checkAvailability);

router
  .route('/')
  .get(getAllBookings)
  .post(createBooking);

router
  .route('/:id')
  .get(getBookingById)
  .put(updateBooking)
  .delete(deleteBooking);

// Specialized action routes
router.patch('/:id/status', updateBookingStatus);
router.patch('/:id/assign', assignBookingDriver);
router.patch('/:id/complete', completeBooking);
router.patch('/:id/payment', recordPayment);

export default router;
