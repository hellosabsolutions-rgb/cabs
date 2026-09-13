import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppLanguage,
  INDIAN_LANGUAGES,
  LanguageInfo,
  getLanguage,
  isAppLanguage,
} from '../i18n/languages';
import {
  catalogs,
  TranslationKey,
  TranslationCatalog,
  en,
} from '../i18n/translations';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  currentLanguage: LanguageInfo;
  availableLanguages: LanguageInfo[];
  t: (key: TranslationKey, fallback?: string) => string;
}

const STORAGE_KEY = 'kabpro_dashboard_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && isAppLanguage(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'en';
  });

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, []);

  const currentLanguage = useMemo(() => getLanguage(language), [language]);

  const activeCatalog: TranslationCatalog = useMemo(() => {
    return catalogs[language] || en;
  }, [language]);

  const t = useCallback(
    (key: TranslationKey, fallback?: string): string => {
      const text = activeCatalog[key];
      if (text !== undefined && text !== '') {
        return text;
      }
      const enText = en[key];
      if (enText !== undefined && enText !== '') {
        return enText;
      }
      return fallback || key;
    },
    [activeCatalog]
  );

  // Sync html lang attribute
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      currentLanguage,
      availableLanguages: INDIAN_LANGUAGES,
      t,
    }),
    [language, setLanguage, currentLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
