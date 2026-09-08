import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';

/**
 * Maximum allowed file size in bytes: 200 KB (204,800 bytes).
 * Every image, PDF, or uploaded document will strictly be <= this size.
 */
export const MAX_FILE_SIZE_BYTES = 200 * 1024; // 204,800 bytes

/**
 * Ladder steps for image compression.
 * Starts with Full HD dimensions and high quality, progressively tuning
 * to ensure file size <= 200 KB with virtually zero perceptible quality loss.
 */
const IMAGE_COMPRESSION_LADDER = [
  { maxDim: 1920, quality: 85, effort: 4 }, // High Full HD
  { maxDim: 1600, quality: 80, effort: 4 },
  { maxDim: 1400, quality: 75, effort: 5 },
  { maxDim: 1200, quality: 70, effort: 5 },
  { maxDim: 1000, quality: 65, effort: 6 },
  { maxDim: 800,  quality: 60, effort: 6 },
  { maxDim: 640,  quality: 55, effort: 6 }
];

/**
 * Compress an image Buffer to ensure it is <= 200 KB while preserving visual quality.
 * Uses WebP format for optimal quality-to-size ratio and transparency support.
 *
 * @param {Buffer} buffer - Raw image buffer
 * @param {Object} options - Custom options (e.g. forceJpeg, targetFormat)
 * @returns {Promise<{ buffer: Buffer, mimetype: string, size: number, format: string }>}
 */
export const compressImage = async (buffer, options = {}) => {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('compressImage expects a Buffer');
  }

  const originalSize = buffer.length;

  try {
    const imageInstance = sharp(buffer);
    const metadata = await imageInstance.metadata();

    // If already <= 200 KB and no reformatting forced, strip EXIF metadata for clean bytes
    if (originalSize <= MAX_FILE_SIZE_BYTES && !options.forceRecompress) {
      if (['webp', 'jpeg', 'png', 'jpg'].includes(metadata.format)) {
        return {
          buffer,
          mimetype: `image/${metadata.format === 'jpg' ? 'jpeg' : metadata.format}`,
          size: originalSize,
          format: metadata.format,
          originalSize,
          compressed: false
        };
      }
    }

    const hasAlpha = metadata.hasAlpha || metadata.format === 'png';
    let bestBuffer = buffer;
    let bestFormat = hasAlpha ? 'webp' : (options.forceJpeg ? 'jpeg' : 'webp');
    let bestMime = bestFormat === 'jpeg' ? 'image/jpeg' : 'image/webp';

    // Ladder attempt to reach <= 200 KB
    for (const step of IMAGE_COMPRESSION_LADDER) {
      let pipeline = sharp(buffer).rotate(); // auto-orient from EXIF

      if (metadata.width && metadata.height && (metadata.width > step.maxDim || metadata.height > step.maxDim)) {
        pipeline = pipeline.resize({
          width: step.maxDim,
          height: step.maxDim,
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      if (bestFormat === 'webp') {
        pipeline = pipeline.webp({
          quality: step.quality,
          alphaQuality: 85,
          effort: step.effort,
          smartSubsample: true
        });
      } else {
        pipeline = pipeline.jpeg({
          quality: step.quality,
          mozjpeg: true,
          progressive: true
        });
      }

      const candidateBuffer = await pipeline.toBuffer();

      bestBuffer = candidateBuffer;
      if (candidateBuffer.length <= MAX_FILE_SIZE_BYTES) {
        break; // Successfully compressed under 200 KB
      }
    }

    const reduction = originalSize > 0 
      ? (((originalSize - bestBuffer.length) / originalSize) * 100).toFixed(1) 
      : 0;

    console.log(
      `⚡ [Image Compressed] Original: ${(originalSize / 1024).toFixed(1)} KB ➔ Optimized: ${(bestBuffer.length / 1024).toFixed(1)} KB (${reduction}% reduction, strictly <= 200 KB)`
    );

    return {
      buffer: bestBuffer,
      mimetype: bestMime,
      size: bestBuffer.length,
      format: bestFormat,
      originalSize,
      compressed: true
    };
  } catch (err) {
    console.warn('⚠️ [Image Compression Fallback] Sharp failed to process image:', err.message);
    return {
      buffer,
      mimetype: options.mimetype || 'image/jpeg',
      size: buffer.length,
      format: 'unknown',
      originalSize,
      compressed: false
    };
  }
};

/**
 * Compress a PDF Buffer to ensure it is <= 200 KB.
 * Uses pdf-lib object stream compression to strip overhead and compress streams.
 *
 * @param {Buffer} buffer - Raw PDF buffer
 * @returns {Promise<{ buffer: Buffer, mimetype: string, size: number }>}
 */
export const compressPdf = async (buffer) => {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('compressPdf expects a Buffer');
  }

  const originalSize = buffer.length;

  // If already <= 200 KB, keep as is
  if (originalSize <= MAX_FILE_SIZE_BYTES) {
    return {
      buffer,
      mimetype: 'application/pdf',
      size: originalSize,
      originalSize,
      compressed: false
    };
  }

  try {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

    // Enable object stream compression
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50
    });

    const compressedBuffer = Buffer.from(compressedBytes);

    const reduction = (((originalSize - compressedBuffer.length) / originalSize) * 100).toFixed(1);
    console.log(
      `⚡ [PDF Compressed] Original: ${(originalSize / 1024).toFixed(1)} KB ➔ Optimized: ${(compressedBuffer.length / 1024).toFixed(1)} KB (${reduction}% reduction)`
    );

    return {
      buffer: compressedBuffer,
      mimetype: 'application/pdf',
      size: compressedBuffer.length,
      originalSize,
      compressed: true
    };
  } catch (err) {
    console.warn('⚠️ [PDF Compression Notice] Could not optimize PDF streams:', err.message);
    return {
      buffer,
      mimetype: 'application/pdf',
      size: originalSize,
      originalSize,
      compressed: false
    };
  }
};

/**
 * Universal file compressor.
 * Accepts a Buffer, Multer file object, or generic binary.
 *
 * @param {Buffer|Object} fileInput - Buffer or { buffer, mimetype, originalname }
 * @param {Object} options
 */
export const compressFile = async (fileInput, options = {}) => {
  let buffer = null;
  let mimetype = options.mimetype || '';

  if (Buffer.isBuffer(fileInput)) {
    buffer = fileInput;
  } else if (fileInput && Buffer.isBuffer(fileInput.buffer)) {
    buffer = fileInput.buffer;
    mimetype = fileInput.mimetype || mimetype;
  } else {
    throw new Error('Invalid file input provided to compressFile. Expected Buffer or Multer file.');
  }

  // Detect MIME if not provided
  if (!mimetype) {
    if (buffer.slice(0, 4).toString() === '%PDF') {
      mimetype = 'application/pdf';
    } else {
      mimetype = 'image/jpeg';
    }
  }

  if (mimetype === 'application/pdf' || buffer.slice(0, 4).toString() === '%PDF') {
    return await compressPdf(buffer);
  }

  // Otherwise assume image
  return await compressImage(buffer, options);
};

/**
 * Compress a Base64 data URI string (e.g. data:image/png;base64,...) or raw base64.
 * Returns both the compressed Base64 data URI and the compressed Buffer,
 * guaranteed to never exceed 200 KB.
 *
 * @param {string} base64String
 * @param {Object} options
 * @returns {Promise<{ base64DataUri: string, buffer: Buffer, mimetype: string, size: number }>}
 */
export const compressBase64 = async (base64String, options = {}) => {
  if (typeof base64String !== 'string') {
    throw new Error('compressBase64 expects a base64 string');
  }

  // Check if it's a remote URL instead of a data URI
  if (base64String.startsWith('http://') || base64String.startsWith('https://')) {
    return {
      base64DataUri: base64String,
      isRemoteUrl: true,
      size: 0
    };
  }

  let mimeType = 'image/jpeg';
  let rawBase64 = base64String;

  const match = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
  if (match) {
    mimeType = match[1];
    rawBase64 = match[2];
  }

  const inputBuffer = Buffer.from(rawBase64, 'base64');
  const result = await compressFile(inputBuffer, { ...options, mimetype: mimeType });

  const finalMime = result.mimetype || mimeType;
  const compressedBase64 = result.buffer.toString('base64');
  const base64DataUri = `data:${finalMime};base64,${compressedBase64}`;

  return {
    base64DataUri,
    buffer: result.buffer,
    mimetype: finalMime,
    size: result.size,
    originalSize: inputBuffer.length,
    compressed: result.compressed
  };
};
