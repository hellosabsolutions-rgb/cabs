import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolve Firebase Admin service account JSON.
 * Prefer FIREBASE_SERVICE_ACCOUNT_PATH, else look for opsiva-*-firebase-adminsdk-*.json in server/.
 */
function resolveServiceAccountPath() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    return path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
  }

  const serverRoot = path.resolve(__dirname, '../..');
  const configuredName = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
  if (configuredName) {
    return path.resolve(serverRoot, configuredName);
  }

  // Default filename used by Opsiva project (gitignored)
  return path.resolve(serverRoot, 'opsiva-e1ee5-firebase-adminsdk-fbsvc-0cb51d6e01.json');
}

const serviceAccountPath = resolveServiceAccountPath();

let firebaseApp = null;
let messaging = null;

try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    const existingApps = getApps();
    if (!existingApps || existingApps.length === 0) {
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      console.log(`🔥 [Firebase Admin] Initialized successfully for project: ${serviceAccount.project_id}`);
    } else {
      firebaseApp = getApp();
    }

    messaging = getMessaging(firebaseApp);
  } else {
    console.warn(`⚠️ [Firebase Admin] Service account file not found at: ${serviceAccountPath}`);
    console.warn('   Set FIREBASE_SERVICE_ACCOUNT_PATH or place the JSON in server/ (gitignored).');
  }
} catch (error) {
  console.error('❌ [Firebase Admin] Initialization failed:', error.message);
}

export { firebaseApp, messaging };
export default firebaseApp;
