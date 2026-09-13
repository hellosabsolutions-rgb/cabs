import express from 'express';
import { handleSos } from '../controllers/sosController.js';

const router = express.Router();

/**
 * @route   POST /api/sos
 * @desc    Receive emergency SOS request with mobile location & dispatch to agency
 */
router.post('/', handleSos);

export default router;
