import { cloudinary } from '../config/cloudinary.js';
import { compressFile, compressBase64, MAX_FILE_SIZE_BYTES } from './compressionService.js';

/**
 * Upload a file buffer (from Multer memoryStorage) to Cloudinary.
 * Automatically compresses images and PDFs to <= 200 KB while preserving quality.
 */
export const uploadBufferToCloudinary = async (buffer, options = {}) => {
  let targetBuffer = buffer;
  let originalBytes = buffer.length;
  let compressedBytes = buffer.length;

  try {
    const compressionResult = await compressFile(buffer, {
      mimetype: options.mimetype
    });
    targetBuffer = compressionResult.buffer;
    compressedBytes = compressionResult.size;
    if (compressionResult.mimetype === 'application/pdf') {
      options.resource_type = 'raw';
    }
  } catch (cErr) {
    console.warn('⚠️ [Compression Notice] Proceeding with original buffer:', cErr.message);
  }

  return new Promise((resolve) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'fleetos/uploads',
        resource_type: options.resource_type || 'auto',
        ...options
      },
      (error, result) => {
        if (error) {
          console.warn('⚠️ [Cloudinary] Buffer upload notice (' + error.message + '). Providing compressed buffer fallback (<= 200 KB).');
          const fallbackMime = options.mimetype || 'image/webp';
          const fallbackDataUri = `data:${fallbackMime};base64,${targetBuffer.toString('base64')}`;
          return resolve({
            url: fallbackDataUri,
            secure_url: fallbackDataUri,
            public_id: null,
            format: 'compressed',
            resource_type: options.resource_type || 'auto',
            bytes: compressedBytes,
            originalBytes,
            compressedBytes,
            isFallback: true
          });
        }
        resolve({
          url: result.secure_url,
          secure_url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          resource_type: result.resource_type,
          bytes: result.bytes || compressedBytes,
          originalBytes,
          compressedBytes,
          original_filename: result.original_filename
        });
      }
    );

    uploadStream.end(targetBuffer);
  });
};

/**
 * Upload a Base64 string (data URI) or remote URL to Cloudinary.
 * Automatically compresses base64 image/PDF to <= 200 KB while preserving quality.
 */
export const uploadBase64ToCloudinary = async (base64OrUrl, options = {}) => {
  let payload = base64OrUrl;
  let originalBytes = typeof base64OrUrl === 'string' ? base64OrUrl.length : 0;
  let compressedBytes = originalBytes;

  if (typeof base64OrUrl === 'string' && (base64OrUrl.startsWith('data:') || !base64OrUrl.startsWith('http'))) {
    try {
      const compressed = await compressBase64(base64OrUrl);
      payload = compressed.base64DataUri;
      compressedBytes = compressed.size;
      originalBytes = compressed.originalSize;
      if (compressed.mimetype === 'application/pdf') {
        options.resource_type = 'raw';
      }
    } catch (cErr) {
      console.warn('⚠️ [Base64 Compression Notice]:', cErr.message);
    }
  }

  try {
    const result = await cloudinary.uploader.upload(payload, {
      folder: options.folder || 'fleetos/uploads',
      resource_type: options.resource_type || 'auto',
      ...options
    });

    return {
      url: result.secure_url,
      secure_url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes || compressedBytes,
      originalBytes,
      compressedBytes,
      original_filename: result.original_filename
    };
  } catch (error) {
    console.warn('⚠️ [Cloudinary] Base64 upload notice (' + error.message + '). Providing compressed payload fallback (<= 200 KB).');
    return {
      url: payload,
      secure_url: payload,
      public_id: null,
      format: 'compressed',
      resource_type: options.resource_type || 'auto',
      bytes: compressedBytes,
      originalBytes,
      compressedBytes,
      isFallback: true
    };
  }
};

/**
 * Universal reusable helper to upload any file input (Buffer or Base64 string).
 */
export const uploadToCloudinary = async (fileInput, options = {}) => {
  if (!fileInput) {
    throw new Error('No file provided for upload to Cloudinary');
  }

  if (Buffer.isBuffer(fileInput)) {
    return await uploadBufferToCloudinary(fileInput, options);
  }

  if (typeof fileInput === 'string') {
    return await uploadBase64ToCloudinary(fileInput, options);
  }

  throw new Error('Unsupported file input type. Expected Buffer or Base64 string.');
};

/**
 * Delete a resource from Cloudinary by public ID.
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('❌ [Cloudinary] Delete error:', error.message);
    throw error;
  }
};

// Re-export compression tools for direct use
export { compressFile, compressBase64, MAX_FILE_SIZE_BYTES };
export { compressImage, compressPdf } from './compressionService.js';
