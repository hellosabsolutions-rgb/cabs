import './loadEnv.js';
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '../..');

/**
 * Resolve Firebase Admin service account JSON.
 * Order: FIREBASE_SERVICE_ACCOUNT_PATH → FIREBASE_SERVICE_ACCOUNT_FILE → auto-discover in server/
 */
function resolveServiceAccountPath() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    return path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
  }

  const configuredName = process.env.FIREBASE_SERVICE_ACCOUNT_FILE?.trim();
  if (configuredName) {
    return path.resolve(serverRoot, configuredName);
  }

  try {
    const matches = fs
      .readdirSync(serverRoot)
      .filter(
        (name) =>
          name.endsWith('.json') &&
          (name.includes('firebase-adminsdk') || name.startsWith('opsiva-'))
      )
      .sort();

    if (matches.length > 0) {
      return path.resolve(serverRoot, matches[0]);
    }
  } catch {
    // fall through
  }

  return null;
}

const serviceAccountPath = resolveServiceAccountPath();

let firebaseApp = null;
let messaging = null;
let firebaseStatus = {
  ready: false,
  projectId: null,
  file: null,
  error: null
};

try {
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    const existingApps = getApps();
    if (!existingApps || existingApps.length === 0) {
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
    } else {
      firebaseApp = getApp();
    }

    messaging = getMessaging(firebaseApp);
    firebaseStatus = {
      ready: true,
      projectId: serviceAccount.project_id || null,
      file: path.basename(serviceAccountPath),
      error: null
    };
  } else {
    firebaseStatus = {
      ready: false,
      projectId: null,
      file: null,
      error: 'Service account JSON not found in server/'
    };
  }
} catch (error) {
  firebaseStatus = {
    ready: false,
    projectId: null,
    file: serviceAccountPath ? path.basename(serviceAccountPath) : null,
    error: error.message
  };
}

export function getFirebaseStatus() {
  return { ...firebaseStatus };
}

export { firebaseApp, messaging };
export default firebaseApp;
