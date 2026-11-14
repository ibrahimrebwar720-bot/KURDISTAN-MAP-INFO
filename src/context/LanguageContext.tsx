import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type AppLanguage = 'ckb' | 'en';

const LANGUAGE_STORAGE_KEY = 'kurdish_history_lang_v1';

export function getInitialLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'ckb';
  try {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang === 'en' || urlLang === 'ckb') {
      return urlLang;
    }
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'en' || stored === 'ckb') {
      return stored;
    }
  } catch {
    // ignore storage errors
  }
  return 'ckb';
}

export function applyLanguageToDom(lang: AppLanguage): void {
  if (typeof document === 'undefined') return;
  const dir = lang === 'en' ? 'ltr' : 'rtl';
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
  document.documentElement.setAttribute('data-lang', lang);
  if (document.body) {
    document.body.dir = dir;
  }
}

interface LanguageContextType {
  language: AppLanguage;
  isEn: boolean;
  dir: 'ltr' | 'rtl';
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  /** Inline helper to choose localized text cleanly */
  pick: <T = string>(ckbValue: T, enValue: T) => T;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'ckb',
  isEn: false,
  dir: 'rtl',
  setLanguage: () => {},
  toggleLanguage: () => {},
  pick: (ckb) => ckb,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const initial = getInitialLanguage();
    applyLanguageToDom(initial);
    return initial;
  });

  useEffect(() => {
    applyLanguageToDom(language);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // ignore storage errors
    }

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (language === 'en') {
        url.searchParams.set('lang', 'en');
      } else {
        url.searchParams.delete('lang');
      }
      const nextPath = `${url.pathname}${url.search}${url.hash}`;
      const curPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextPath !== curPath) {
        window.history.replaceState(window.history.state, '', nextPath);
      }
    }
  }, [language]);

  const setLanguage = useCallback((nextLang: AppLanguage) => {
    setLanguageState(nextLang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'ckb' ? 'en' : 'ckb'));
  }, []);

  const pick = useCallback(
    <T = string>(ckbValue: T, enValue: T): T => (language === 'en' ? enValue : ckbValue),
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        isEn: language === 'en',
        dir: language === 'en' ? 'ltr' : 'rtl',
        setLanguage,
        toggleLanguage,
        pick,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
