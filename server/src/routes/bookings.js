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
import { protectDriver } from '../middleware/authMiddleware.js';

const router = express.Router();

// Authenticated driver route (must be before /:id)
router.get('/my', protectDriver, getMyBookings);

// Vehicle availability route
router.get('/availability', checkAvailability);

// CRUD routes
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
