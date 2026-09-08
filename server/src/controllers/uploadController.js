import { uploadBufferToCloudinary, uploadBase64ToCloudinary } from '../services/cloudinaryService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * @desc    Upload a single file (Buffer via multipart or Base64 string via JSON) to Cloudinary
 * @route   POST /api/upload
 * @access  Private / Public
 */
export const uploadSingle = asyncHandler(async (req, res) => {
  const folder = req.body.folder || 'fleetos/documents';

  // 1. Multipart/form-data upload (via Multer memoryStorage)
  if (req.file) {
    const isPdf = req.file.mimetype === 'application/pdf';
    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder,
      mimetype: req.file.mimetype,
      resource_type: isPdf ? 'raw' : 'auto'
    });

    return res.status(200).json({
      success: true,
      message: 'File compressed and uploaded successfully (<= 200 KB guaranteed)',
      data: result,
      url: result.secure_url,
      sizeKB: (result.compressedBytes / 1024).toFixed(1),
      maxLimitKB: 200
    });
  }

  // 2. Base64 data URI string via JSON
  const base64Data = req.body.file || req.body.base64 || req.body.image;
  if (base64Data && typeof base64Data === 'string') {
    const isPdf = base64Data.startsWith('data:application/pdf');
    const result = await uploadBase64ToCloudinary(base64Data, {
      folder,
      resource_type: isPdf ? 'raw' : 'auto'
    });

    return res.status(200).json({
      success: true,
      message: 'Base64 file compressed and uploaded successfully (<= 200 KB guaranteed)',
      data: result,
      url: result.secure_url,
      sizeKB: (result.compressedBytes / 1024).toFixed(1),
      maxLimitKB: 200
    });
  }

  return res.status(400).json({
    success: false,
    error: 'No file provided. Send either a multipart file or a base64 string in req.body.file.'
  });
});

/**
 * @desc    Upload multiple files to Cloudinary in parallel
 * @route   POST /api/upload/multiple
 * @access  Private / Public
 */
export const uploadMultiple = asyncHandler(async (req, res) => {
  const folder = req.body.folder || 'fleetos/documents';

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No files provided for upload.'
    });
  }

  const uploadPromises = req.files.map((file) => {
    const isPdf = file.mimetype === 'application/pdf';
    return uploadBufferToCloudinary(file.buffer, {
      folder,
      mimetype: file.mimetype,
      resource_type: isPdf ? 'raw' : 'auto'
    });
  });

  const results = await Promise.all(uploadPromises);

  res.status(200).json({
    success: true,
    message: `${results.length} files compressed and uploaded successfully (<= 200 KB each guaranteed)`,
    data: results,
    urls: results.map((r) => r.secure_url),
    maxLimitKB: 200
  });
});
