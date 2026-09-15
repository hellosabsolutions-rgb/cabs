import { uploadToCloudinary } from '../services/cloudinaryService.js';

export const isRemoteMediaUrl = (value) =>
  typeof value === 'string' &&
  (value.startsWith('http://') || value.startsWith('https://'));

export const isUploadableMedia = (value) => {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('file:')) return false;
  if (isRemoteMediaUrl(trimmed)) return false;
  if (trimmed.startsWith('data:')) return true;
  // Raw base64 without data-uri prefix (common from mobile clients)
  return trimmed.length > 256 && /^[A-Za-z0-9+/=\s]+$/.test(trimmed);
};

/**
 * Upload a single base64/data-uri value to Cloudinary (Sharp compression runs inside cloudinaryService).
 * Returns HTTPS URL. Already-remote URLs pass through unchanged.
 */
export const uploadMediaValue = async (value, folder = 'fleetos/uploads') => {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isRemoteMediaUrl(trimmed)) return trimmed;
  if (!isUploadableMedia(trimmed)) return trimmed;

  const payload = trimmed.startsWith('data:') ? trimmed : `data:image/jpeg;base64,${trimmed}`;
  const isPdf = payload.startsWith('data:application/pdf');

  try {
    const uploaded = await uploadToCloudinary(payload, {
      folder,
      resource_type: isPdf ? 'raw' : 'auto'
    });
    return uploaded.secure_url || uploaded.url || trimmed;
  } catch (err) {
    console.warn(`⚠️ [MediaUpload] Cloudinary upload failed for ${folder}:`, err.message);
    return trimmed;
  }
};

/**
 * Process configured media fields on a request body before DB save.
 * @param {Object} body
 * @param {Array<string|{ field: string, folder?: string }>} mediaFields
 */
export const processMediaFields = async (body, mediaFields = []) => {
  if (!body || !mediaFields?.length) return body;

  const next = { ...body };

  await Promise.all(
    mediaFields.map(async (spec) => {
      const field = typeof spec === 'string' ? spec : spec.field;
      const folder = typeof spec === 'string' ? 'fleetos/uploads' : spec.folder || 'fleetos/uploads';

      if (!(field in next)) return;

      const val = next[field];
      if (Array.isArray(val)) {
        next[field] = await Promise.all(val.map((item) => uploadMediaValue(item, folder)));
        return;
      }

      next[field] = await uploadMediaValue(val, folder);
    })
  );

  return next;
};
