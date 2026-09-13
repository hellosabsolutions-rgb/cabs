import { Platform, TurboModuleRegistry } from 'react-native';
import { GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '../constants/config';

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

let configured = false;

/** True only inside a native build that linked RNGoogleSignin (not Expo Go). */
export function isGoogleSignInAvailable() {
  try {
    return TurboModuleRegistry.get('RNGoogleSignin') != null;
  } catch {
    return false;
  }
}

function loadGoogleSignin(): GoogleSigninModule {
  if (!isGoogleSignInAvailable()) {
    throw new Error(
      'Google Sign-In needs the native KABPRO Driver app. Stop Expo Go and run: npx expo run:ios'
    );
  }
  // Load only after the TurboModule exists — static import crashes Expo Go at boot.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@react-native-google-signin/google-signin') as GoogleSigninModule;
}

export function configureGoogleSignIn() {
  if (configured) return;
  const { GoogleSignin } = loadGoogleSignin();
  GoogleSignin.configure({
    webClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    offlineAccess: false,
  });
  configured = true;
}

export class GoogleSignInCancelled extends Error {
  constructor() {
    super('cancelled');
    this.name = 'GoogleSignInCancelled';
  }
}

export async function signInWithGoogleNative() {
  configureGoogleSignIn();
  const { GoogleSignin } = loadGoogleSignin();

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const response = await GoogleSignin.signIn();
  if (response.type !== 'success') {
    throw new GoogleSignInCancelled();
  }

  let accessToken: string | null = null;
  try {
    const tokens = await GoogleSignin.getTokens();
    accessToken = tokens.accessToken;
  } catch {
    accessToken = null;
  }

  return {
    idToken: response.data.idToken,
    accessToken,
  };
}

export async function signOutGoogleNative() {
  if (!isGoogleSignInAvailable()) return;
  try {
    configureGoogleSignIn();
    const { GoogleSignin } = loadGoogleSignin();
    await GoogleSignin.signOut();
  } catch {
    // Ignore if Google was never signed in on this device.
  }
}

export function googleErrorMessage(error: unknown, fallback: string) {
  if (error instanceof GoogleSignInCancelled) return '';

  if (isGoogleSignInAvailable()) {
    try {
      const { isErrorWithCode, statusCodes } = loadGoogleSignin();
      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) return '';
        if (error.code === statusCodes.IN_PROGRESS) return fallback;
        if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          return 'Google Play services are required for Google sign-in.';
        }
      }
    } catch {
      // Fall through to string matching.
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  if (/native module|ExponentGoogle|RNGoogleSignin|expo run:ios|Expo Go/i.test(message)) {
    return 'Rebuild and open the native app (npx expo run:ios). Google Sign-In does not work in Expo Go.';
  }
  if (message) return message;
  return fallback;
}
