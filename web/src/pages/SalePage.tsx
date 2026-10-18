import { useTranslation } from 'react-i18next';

export function SalePage() {
  const { t } = useTranslation('sale');
  return <h1 className="text-2xl font-semibold">{t('title')}</h1>;
}
