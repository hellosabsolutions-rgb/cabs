import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName, useColorScheme } from 'react-native';
import {
  ColorTokens,
  darkColors,
  getType,
  lightColors,
} from './colors';
import {
  AppSettings,
  defaultSettings,
  loadSettings,
  saveSettings,
} from '../settings/storage';
import { translate } from '../i18n/catalogs';
import type { MessageKey } from '../i18n/en';

type ThemeContextValue = {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  scheme: 'light' | 'dark';
  colors: ColorTokens;
  type: ReturnType<typeof getType>;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveScheme(
  appearance: AppSettings['appearance'],
  system: ColorSchemeName
): 'light' | 'dark' {
  if (appearance === 'system') return system === 'dark' ? 'dark' : 'light';
  return appearance;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(system);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  const scheme = resolveScheme(settings.appearance, systemScheme ?? system);
  const colors = scheme === 'dark' ? darkColors : lightColors;
  const type = useMemo(() => getType(colors), [colors]);

  const updateSettings = (patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      scheme,
      colors,
      type,
      t: (key: MessageKey, vars?: Record<string, string | number>) =>
        translate(settings.language, key, vars),
    }),
    [settings, scheme, colors, type]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      settings: defaultSettings,
      updateSettings: () => {},
      scheme: 'light' as const,
      colors: lightColors,
      type: getType(lightColors),
      t: (key: MessageKey, vars?: Record<string, string | number>) =>
        translate('en', key, vars),
    };
  }
  return ctx;
}
