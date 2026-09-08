import { getCorsOrigins } from './loadEnv.js';

export function corsOriginCallback(origin, callback) {
  const allowed = getCorsOrigins();
  if (!origin || allowed.includes(origin)) {
    callback(null, true);
    return;
  }
  callback(null, false);
}

export function getSocketCorsOrigin() {
  const allowed = getCorsOrigins();
  return allowed.length === 1 ? allowed[0] : allowed;
}
