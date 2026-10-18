// REVIEW AMHARIC WITH A NATIVE SPEAKER BEFORE DEMO
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import am from './am.json';
import en from './en.json';

export const namespaces = [
  'common',
  'nav',
  'auth',
  'errors',
  'sale',
  'items',
  'dashboard',
  'insights',
  'simulator',
  'reports',
  'demo',
] as const;

void i18n.use(initReactI18next).init({
  resources: { en, am },
  lng: 'en',
  fallbackLng: 'en',
  ns: [...namespaces],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
