import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../i18n';
import type { Locale } from '../shared/types';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'en',
      setLocale: (locale) => {
        set({ locale });
        void i18n.changeLanguage(locale);
      },
    }),
    { name: 'mpesa-copilot-locale' },
  ),
);
