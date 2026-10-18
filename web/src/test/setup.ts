import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { setUnauthorizedHandler } from '../api/client';
import i18n from '../i18n';
import { useAuthStore } from '../store/auth';
import { useLocaleStore } from '../store/locale';

afterEach(() => {
  cleanup();
  localStorage.clear();
  useAuthStore.getState().clearSession();
  useLocaleStore.setState({ locale: 'en' });
  void i18n.changeLanguage('en');
  setUnauthorizedHandler(() => {});
});
