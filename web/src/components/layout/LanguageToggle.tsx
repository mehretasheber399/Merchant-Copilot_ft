import { useTranslation } from 'react-i18next';
import { useLocaleStore } from '../../store/locale';
import type { Locale } from '../../shared/types';

export function LanguageToggle() {
  const { t } = useTranslation('common');
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const options: { id: Locale; label: string }[] = [
    { id: 'en', label: t('langEn') },
    { id: 'am', label: t('langAm') },
  ];

  return (
    <div
      role="group"
      aria-label={t('language')}
      className="flex shrink-0 overflow-hidden rounded-control border border-line"
    >
      {options.map((option) => {
        const selected = locale === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            className={`min-h-12 min-w-12 px-2 text-sm font-semibold ${selected ? 'bg-primary text-primary-foreground' : 'bg-surface text-ink'}`}
            onClick={() => setLocale(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
