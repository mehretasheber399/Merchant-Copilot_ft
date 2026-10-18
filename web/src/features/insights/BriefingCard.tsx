import { useTranslation } from 'react-i18next';
import type { InsightsPayload, Locale } from '../../shared/types';
import { textOf } from './logic';

export function BriefingCard({
  briefing,
  locale,
}: {
  briefing: InsightsPayload['briefing'] | undefined;
  locale: Locale;
}) {
  const { t } = useTranslation('insights');
  const body = textOf(briefing, locale);
  if (!body && !briefing) {
    return null;
  }
  return (
    <section
      aria-label={t('briefingTitle')}
      className="rounded-card border border-line bg-surface p-3"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold">{t('briefingTitle')}</h2>
        {briefing?.source === 'llm' ? (
          <span className="rounded-control bg-primary-soft px-2 py-1 text-sm font-semibold text-primary">
            {t('ai')}
          </span>
        ) : null}
      </div>
      {body ? <p className="mt-2 break-words">{body}</p> : null}
    </section>
  );
}
