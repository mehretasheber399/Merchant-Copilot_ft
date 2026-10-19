import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { loginPathFor, setUnauthorizedHandler } from './api/client';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineBanner } from './components/OfflineBanner';
import { AppShell } from './components/layout/AppShell';
import { RequireAuth } from './components/layout/RequireAuth';
import { ToastViewport } from './components/ui/Toast';
import i18n from './i18n';
import { CustomerSimPage } from './pages/CustomerSimPage';
import { DashboardPage } from './pages/DashboardPage';
import { InsightsPage } from './pages/InsightsPage';
import { ItemsPage } from './pages/ItemsPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ReportsPage } from './pages/ReportsPage';
import { SalePage } from './pages/SalePage';
import { queryClient } from './queryClient';
import { useAuthStore, validateSession } from './store/auth';
import { useLocaleStore } from './store/locale';
import { retainStream } from './stream/stream';

function StreamConnection() {
  const token = useAuthStore((state) => state.token);
  useEffect(() => {
    if (!token) {
      return;
    }
    return retainStream();
  }, [token]);
  return null;
}

function SessionEffects() {
  const navigate = useNavigate();
  const locale = useLocaleStore((state) => state.locale);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      const hadSession = Boolean(useAuthStore.getState().token);
      useAuthStore.getState().clearSession();
      const base = loginPathFor(window.location.pathname, window.location.search);
      const join = base.includes('?') ? '&' : '?';
      navigate(hadSession ? `${base}${join}expired=1` : base, { replace: true });
    });
    void validateSession();
  }, [navigate]);

  useEffect(() => {
    void i18n.changeLanguage(locale);
    document.documentElement.lang = locale === 'am' ? 'am' : 'en';
    document.title = i18n.t('common:appName');
  }, [locale]);

  return null;
}

export function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SessionEffects />
          <StreamConnection />
          <ErrorBoundary>
            <OfflineBanner />
            <ToastViewport />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/customer-sim" element={<CustomerSimPage />} />
              <Route
                element={
                  <RequireAuth>
                    <AppShell />
                  </RequireAuth>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/sale" element={<SalePage />} />
                <Route path="/items" element={<ItemsPage />} />
                <Route path="/insights" element={<InsightsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
//test1