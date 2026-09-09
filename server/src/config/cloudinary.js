import './loadEnv.js';
import { v2 as cloudinary } from 'cloudinary';

function trim(value) {
  return typeof value === 'string' ? value.trim() : '';
}

const cloudName = trim(process.env.CLOUDINARY_CLOUD_NAME);
const apiKey = trim(process.env.CLOUDINARY_API_KEY);
const apiSecret = trim(process.env.CLOUDINARY_API_SECRET);

cloudinary.config({
  cloud_name: cloudName || undefined,
  api_key: apiKey || undefined,
  api_secret: apiSecret || undefined,
  secure: true
});

let cloudinaryStatus = {
  ready: false,
  configured: Boolean(cloudName && apiKey && apiSecret),
  cloudName: cloudName || null,
  error: null
};

if (!cloudinaryStatus.configured) {
  cloudinaryStatus.error = 'CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET missing';
}

/**
 * Live ping Cloudinary (call once at boot). Does not log secrets.
 */
export async function verifyCloudinary() {
  if (!cloudinaryStatus.configured) {
    return getCloudinaryStatus();
  }

  try {
    const result = await cloudinary.api.ping();
    const ok = result?.status === 'ok' || result?.status === 'OK' || Boolean(result);
    cloudinaryStatus = {
      ready: ok,
      configured: true,
      cloudName,
      error: ok ? null : 'Unexpected ping response'
    };
  } catch (error) {
    cloudinaryStatus = {
      ready: false,
      configured: true,
      cloudName,
      error: error.message || 'Cloudinary ping failed'
    };
  }

  return getCloudinaryStatus();
}

export function getCloudinaryStatus() {
  return { ...cloudinaryStatus };
}

export { cloudinary };
export default cloudinary;
