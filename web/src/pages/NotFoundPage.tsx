import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export function NotFoundPage() {
  const { t } = useTranslation('common');
  const token = useAuthStore((state) => state.token);
  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-[420px] content-center gap-4 bg-surface px-4">
      <h1 className="text-2xl font-semibold">{t('notFound')}</h1>
      <Link
        to={token ? '/dashboard' : '/login'}
        className="inline-flex min-h-control items-center justify-center rounded-control bg-primary px-4 font-semibold text-primary-foreground"
      >
        {token ? t('goDashboard') : t('goLogin')}
      </Link>
    </div>
  );
}
