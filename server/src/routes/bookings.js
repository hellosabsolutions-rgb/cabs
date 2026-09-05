import express from 'express';
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  completeBooking,
  recordPayment,
  checkAvailability,
  deleteBooking
} from '../controllers/bookingController.js';

const router = express.Router();

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
router.patch('/:id/complete', completeBooking);
router.patch('/:id/payment', recordPayment);

export default router;
