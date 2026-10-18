import { useTranslation } from 'react-i18next';

export function DashboardPage() {
  const { t } = useTranslation('dashboard');
  return <h1 className="text-2xl font-semibold">{t('title')}</h1>;
}
