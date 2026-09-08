import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the service account JSON in server root
const serviceAccountPath = path.resolve(__dirname, '../../opsiva-e1ee5-firebase-adminsdk-fbsvc-0cb51d6e01.json');

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
  }
} catch (error) {
  console.error('❌ [Firebase Admin] Initialization failed:', error.message);
}

export { firebaseApp, messaging };
export default firebaseApp;
