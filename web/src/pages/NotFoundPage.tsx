import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export function NotFoundPage() {
  const { t } = useTranslation('common');
  const token = useAuthStore((state) => state.token);
  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-[420px] content-center gap-4 bg-canvas px-4">
      <h1 className="text-2xl font-extrabold tracking-tight">{t('notFound')}</h1>
      <Link
        to={token ? '/dashboard' : '/login'}
        className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-4 font-bold text-primary-foreground shadow-shell"
      >
        {token ? t('goDashboard') : t('goLogin')}
      </Link>
    </div>
  );
}
