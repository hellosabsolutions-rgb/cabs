import * as SecureStore from 'expo-secure-store';
import { isAppLanguage, type AppLanguage } from '../i18n/languages';

export type AppearanceMode = 'light' | 'dark' | 'system';
export type { AppLanguage };

export type AppSettings = {
  appearance: AppearanceMode;
  pushNotifications: boolean;
  dutyReminders: boolean;
  approvalAlerts: boolean;
  locationOnDuty: boolean;
  autoSync: boolean;
  haptics: boolean;
  keepScreenAwake: boolean;
  language: AppLanguage;
  biometricLock: boolean;
};

export const defaultSettings: AppSettings = {
  appearance: 'system',
  pushNotifications: true,
  dutyReminders: true,
  approvalAlerts: true,
  locationOnDuty: true,
  autoSync: true,
  haptics: true,
  keepScreenAwake: false,
  language: 'en',
  biometricLock: false,
};

const KEY = 'kabpro.driver.settings';

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return defaultSettings;
    const parsed = { ...defaultSettings, ...JSON.parse(raw) };
    if (!isAppLanguage(parsed.language)) parsed.language = 'en';
    return parsed;
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(settings));
}
