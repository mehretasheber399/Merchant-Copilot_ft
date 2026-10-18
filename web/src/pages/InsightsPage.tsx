import { useTranslation } from 'react-i18next';

export function InsightsPage() {
  const { t } = useTranslation('insights');
  return <h1 className="text-2xl font-semibold">{t('title')}</h1>;
}
