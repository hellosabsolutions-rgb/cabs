import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'kabpro.driver.accessToken';
const REFRESH_KEY = 'kabpro.driver.refreshToken';
const REMEMBER_KEY = 'kabpro.driver.rememberMe';
const IDENTIFIER_KEY = 'kabpro.driver.lastIdentifier';

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function getRememberMe() {
  const value = await SecureStore.getItemAsync(REMEMBER_KEY);
  return value !== '0';
}

export async function getLastIdentifier() {
  return SecureStore.getItemAsync(IDENTIFIER_KEY);
}

export async function saveLastIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  if (!trimmed) {
    await SecureStore.deleteItemAsync(IDENTIFIER_KEY);
    return;
  }
  await SecureStore.setItemAsync(IDENTIFIER_KEY, trimmed);
}

export async function saveTokens(
  accessToken: string,
  refreshToken?: string | null,
  rememberMe = true
) {
  await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
  await SecureStore.setItemAsync(REMEMBER_KEY, rememberMe ? '1' : '0');

  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  }
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  // Keep last identifier + remember preference for the login form.
}

export async function clearSession(options?: { clearIdentifier?: boolean }) {
  await clearTokens();
  if (options?.clearIdentifier) {
    await SecureStore.deleteItemAsync(IDENTIFIER_KEY);
    await SecureStore.deleteItemAsync(REMEMBER_KEY);
  }
}
