import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  refreshTokenHandler,
  logout,
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshTokenHandler);
router.post('/logout', logout);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);

// Multi-device sessions
router.get('/sessions', protect, getActiveSessions);
router.delete('/sessions', protect, revokeAllOtherSessions);
router.delete('/sessions/:id', protect, revokeSession);

export default router;

