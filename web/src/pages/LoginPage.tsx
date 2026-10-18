import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { login } from '../api/endpoints';
import i18n from '../i18n';
import { LanguageToggle } from '../components/layout/LanguageToggle';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { SaleHero } from '../features/sale/SaleHero';
import { useAuthStore } from '../store/auth';

function safeReturn(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/login')) {
    return '/dashboard';
  }
  return value;
}

function loginMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return i18n.t('errors:network');
  }
  if (error.status === 401) {
    return i18n.t('errors:wrongCredentials');
  }
  if (error.status === 429 || error.code === 'RATE_LIMITED') {
    return i18n.t('errors:rateLimited');
  }
  if (error.code === 'VALIDATION_ERROR') {
    if (error.issues.length > 0) {
      return error.issues.map((issue) => issue.message).join(' ');
    }
    return i18n.t('errors:validation');
  }
  if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT' || error.status === 0) {
    return i18n.t('errors:network');
  }
  return i18n.t('errors:generic');
}

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = useAuthStore((state) => state.token);
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const destination = safeReturn(params.get('returnTo'));

  if (token) {
    return <Navigate to={destination} replace />;
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    void login(email.trim(), password)
      .then((result) => {
        setSession(result.token, result.merchant);
        navigate(destination, { replace: true });
      })
      .catch((caught: unknown) => {
        setError(loginMessage(caught));
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col bg-canvas">
      <header className="rounded-b-[28px] bg-primary px-4 pb-5 pt-[max(0.75rem,env(safe-area-inset-top))] text-primary-foreground shadow-shell">
        <div className="flex min-h-14 items-center gap-3">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/20 text-sm font-extrabold"
          >
            M
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70">
              {t('common:appName')}
            </p>
            <h1 className="truncate text-base font-bold">{t('auth:title')}</h1>
          </div>
          <LanguageToggle onDark />
        </div>
      </header>
      <main className="flex flex-1 flex-col px-4 pb-8 pt-5">
        <SaleHero />
        {params.get('expired') === '1' ? (
          <p
            role="status"
            className="mb-4 rounded-card bg-warning-soft px-4 py-3 font-semibold text-warning"
          >
            {t('auth:expired')}
          </p>
        ) : null}
        <form
          className="grid gap-4 rounded-card border border-line bg-surface p-4"
          onSubmit={onSubmit}
        >
          <Input
            label={t('auth:email')}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Input
            label={t('auth:password')}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error ? (
            <p role="alert" className="text-sm font-semibold text-danger">
              {error}
            </p>
          ) : null}
          <Button type="submit" loading={loading}>
            {loading ? t('common:loading') : t('auth:submit')}
          </Button>
        </form>
      </main>
    </div>
  );
}
