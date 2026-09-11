import { Platform } from 'react-native';

const trim = (value?: string) => value?.trim() || undefined;

/**
 * API base URL for KABPRO backend.
 * Prefer EXPO_PUBLIC_API_BASE_URL (e.g. physical device LAN IP).
 * Otherwise use platform-specific defaults from .env.
 */
export const API_BASE_URL =
  trim(process.env.EXPO_PUBLIC_API_BASE_URL) ||
  Platform.select({
    android:
      trim(process.env.EXPO_PUBLIC_API_BASE_URL_ANDROID) || 'http://10.0.2.2:5001/api',
    default:
      trim(process.env.EXPO_PUBLIC_API_BASE_URL_IOS) || 'http://localhost:5001/api',
  })!;

export const APP_NAME = trim(process.env.EXPO_PUBLIC_APP_NAME) || 'KABPRO Driver';

/** Android OAuth client ID. Used as webClientId so Android can return an ID token. */
export const GOOGLE_ANDROID_CLIENT_ID =
  trim(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID) ||
  '546992458715-ba6gkh5ud492pucdhrg1fi09tuhsg1e8.apps.googleusercontent.com';

/** iOS OAuth client ID from GoogleService-Info.plist (bundle in.kabpro.driver). */
export const GOOGLE_IOS_CLIENT_ID =
  trim(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID) ||
  '546992458715-8jt589ame54ts6mpnf7bjjn7s3l21r6a.apps.googleusercontent.com';

export const GOOGLE_CLIENT_ID = GOOGLE_ANDROID_CLIENT_ID;
