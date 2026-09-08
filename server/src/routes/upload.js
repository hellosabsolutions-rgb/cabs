import express from 'express';
import { uploadSingle, uploadMultiple } from '../controllers/uploadController.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

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
