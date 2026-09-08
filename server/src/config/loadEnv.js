import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(__dirname, '..', '..');

const nodeEnv = process.env.NODE_ENV || 'development';
const envFile =
  nodeEnv === 'production' ? '.env.production' : '.env.development';

dotenv.config({ path: path.join(serverRoot, envFile) });
dotenv.config({ path: path.join(serverRoot, '.env') });

const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
];

/**
 * Browser origins allowed for CORS + Socket.IO.
 * Set CORS_ORIGINS (comma-separated). CLIENT_URL is merged for backwards compatibility.
 */
export function getCorsOrigins() {
  const fromEnv = [process.env.CORS_ORIGINS, process.env.CLIENT_URL]
    .filter(Boolean)
    .join(',')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const unique = [...new Set(fromEnv)];

  if (nodeEnv !== 'production') {
    for (const origin of DEV_ORIGINS) {
      if (!unique.includes(origin)) unique.push(origin);
    }
  }

  return unique;
}

export function getPublicApiUrl() {
  return (
    process.env.PUBLIC_API_URL?.replace(/\/$/, '') ||
    'http://localhost:5000'
  );
}
