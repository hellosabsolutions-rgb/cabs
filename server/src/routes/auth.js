import express from 'express';
import {
  register,
  login,
  googleLogin,
  getMe,
  updateProfile,
  updatePassword,
  refreshTokenHandler,
  logout,
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions
} from '../controllers/authController.js';
import {
  driverLogin,
  driverGoogleLogin,
  getDriverMe,
  startDriverDuty,
  endDriverDuty
} from '../controllers/driverAuthController.js';
import { protect, protectDriver } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/refresh', refreshTokenHandler);
router.post('/logout', logout);

router.post('/driver/login', driverLogin);
router.post('/driver/google', driverGoogleLogin);
router.get('/driver/me', protectDriver, getDriverMe);
router.post('/driver/duty/start', protectDriver, startDriverDuty);
router.post('/driver/duty/end', protectDriver, endDriverDuty);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);

// Multi-device sessions
router.get('/sessions', protect, getActiveSessions);
router.delete('/sessions', protect, revokeAllOtherSessions);
router.delete('/sessions/:id', protect, revokeSession);

export default router;

