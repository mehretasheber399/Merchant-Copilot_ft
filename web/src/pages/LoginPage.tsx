import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { login } from '../api/endpoints';
import i18n from '../i18n';
import { SantimClip } from '../components/SantimClip';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/auth';
import { useLocaleStore } from '../store/locale';
import type { Locale } from '../shared/types';

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

const languages: { id: Locale; labelKey: 'auth:english' | 'auth:amharic' }[] = [
  { id: 'en', labelKey: 'auth:english' },
  { id: 'am', labelKey: 'auth:amharic' },
];

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = useAuthStore((state) => state.token);
  const merchant = useAuthStore((state) => state.merchant);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const destination = safeReturn(params.get('returnTo'));

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
    <div className="relative mx-auto min-h-dvh w-full max-w-[420px] overflow-hidden bg-[#10261c]">
      <SantimClip className="absolute inset-x-0 top-0 h-[52%] w-full object-cover object-[50%_40%]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[52%] bg-gradient-to-b from-black/25 via-black/10 to-[#10261c]" />
      <div className="relative flex min-h-dvh flex-col px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5 text-white">
            <span
              aria-hidden="true"
              className="grid h-11 w-11 shrink-0 -rotate-6 place-items-center rounded-[14px] bg-primary text-lg font-extrabold shadow-shell"
            >
              S
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight">{t('common:appName')}</p>
              <p className="mt-1 text-xs text-white/80">{t('sale:heroCaption')}</p>
            </div>
          </div>
          <div
            role="group"
            aria-label={t('common:language')}
            className="flex shrink-0 rounded-full border border-white/30 bg-black/35 p-1 backdrop-blur-md"
          >
            {languages.map((language) => {
              const selected = locale === language.id;
              return (
                <button
                  key={language.id}
                  type="button"
                  aria-pressed={selected}
                  className={`min-h-12 whitespace-nowrap rounded-full px-3.5 text-sm font-semibold ${selected ? 'bg-white text-primary' : 'text-white'}`}
                  onClick={() => setLocale(language.id)}
                >
                  {t(language.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-28">
          <h1 className="max-w-[16rem] text-3xl font-bold leading-tight tracking-tight text-white">
            {t('sale:heroTitle')}
          </h1>
        </div>

        <div className="mt-auto rounded-[24px] border border-white/60 bg-white/95 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.28)] backdrop-blur-md">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
            {t('auth:title')}
          </p>
          {token ? (
            <div className="mt-3 grid gap-3">
              <p className="text-sm text-muted">{t('auth:signedIn')}</p>
              <p className="text-xl font-bold">{merchant?.businessName}</p>
              <Button onClick={() => navigate(destination, { replace: true })}>
                {t('auth:continue')}
              </Button>
              <Button variant="secondary" onClick={() => clearSession()}>
                {t('common:logout')}
              </Button>
            </div>
          ) : (
            <form className="mt-4 grid gap-4" onSubmit={onSubmit}>
              {params.get('expired') === '1' ? (
                <p
                  role="status"
                  className="rounded-xl bg-warning-soft px-3 py-3 text-sm font-semibold text-warning"
                >
                  {t('auth:expired')}
                </p>
              ) : null}
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
          )}
        </div>
      </div>
    </div>
  );
}
