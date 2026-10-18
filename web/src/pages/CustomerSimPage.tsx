import { useTranslation } from 'react-i18next';

export function CustomerSimPage() {
  const { t } = useTranslation('simulator');
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col gap-3 bg-surface px-4 py-8">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="text-base text-muted">{t('placeholder')}</p>
    </div>
  );
}
