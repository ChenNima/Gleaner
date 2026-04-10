import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import zh from './zh';

function detectSystemLanguage(): string {
  // Check navigator.languages array first (more comprehensive)
  const langs = [...(navigator.languages ?? []), navigator.language].map((l) => l.toLowerCase());
  if (langs.some((l) => l.startsWith('zh'))) return 'zh';
  return 'en';
}

function getInitialLanguage(): string {
  const stored = localStorage.getItem('gleaner-language');
  if (stored && stored !== 'system') return stored;
  return detectSystemLanguage();
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;

export function setLanguage(lang: 'en' | 'zh' | 'system') {
  localStorage.setItem('gleaner-language', lang);
  if (lang === 'system') {
    i18n.changeLanguage(detectSystemLanguage());
  } else {
    i18n.changeLanguage(lang);
  }
}

export function getLanguageSetting(): 'en' | 'zh' | 'system' {
  return (localStorage.getItem('gleaner-language') as 'en' | 'zh' | 'system') ?? 'system';
}
