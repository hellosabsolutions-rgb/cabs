import express from 'express';
import { uploadSingle, uploadMultiple } from '../controllers/uploadController.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { protectUserOrDriver } from '../middleware/authMiddleware.js';

const router = express.Router();

// Dashboard users and driver app share upload endpoints
router.use(protectUserOrDriver);

/**
 * @route   POST /api/upload
 * @desc    Upload single image, PDF, or document to Cloudinary
 */
router.post('/', upload.single('file'), uploadSingle);

/**
 * @route   POST /api/upload/multiple
 * @desc    Upload multiple images, PDFs, or documents to Cloudinary
 */
router.post('/multiple', upload.array('files', 10), uploadMultiple);

export default router;
