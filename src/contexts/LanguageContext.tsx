import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getLangFromPath, localePath, stripLangPrefix } from '@/lib/content';

type Language = 'ar' | 'en';
type Direction = 'rtl' | 'ltr';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (ar: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // The URL is the single source of truth: "/" => Arabic, "/en/..." => English
  const [language] = useState<Language>(() => getLangFromPath());
  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

  /** Switching language navigates to the same page under the other language URL */
  const setLanguage = (lang: Language) => {
    if (lang === language) return;
    localStorage.setItem('flywings-language', lang);
    const target = localePath(stripLangPrefix(window.location.pathname), lang);
    window.location.assign(`${target}${window.location.search}${window.location.hash}`);
  };

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
    localStorage.setItem('flywings-language', language);
  }, [language, direction]);

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
