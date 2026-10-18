import { useTranslation } from 'react-i18next';
import { useLocaleStore } from '../../store/locale';
import type { Locale } from '../../shared/types';

export function LanguageToggle({
  onDark = false,
  wide = false,
}: {
  onDark?: boolean;
  wide?: boolean;
}) {
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
      className={`flex overflow-hidden rounded-full border p-1 ${wide ? 'w-full' : 'shrink-0'} ${onDark ? 'border-white/30 bg-white/15' : 'border-line bg-canvas shadow-card'}`}
    >
      {options.map((option) => {
        const selected = locale === option.id;
        const tone = onDark
          ? selected
            ? 'bg-white text-primary'
            : 'text-white'
          : selected
            ? 'bg-primary text-primary-foreground'
            : 'text-ink';
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            className={`min-h-12 rounded-full px-3 text-sm font-semibold ${wide ? 'flex-1' : 'min-w-12'} ${tone}`}
            onClick={() => setLocale(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
