import { useTranslation } from 'react-i18next';
import type { InsightsPayload, Locale } from '../../shared/types';
import { briefingLines, textOf } from './logic';

export function BriefingCard({
  briefing,
  locale,
}: {
  briefing: InsightsPayload['briefing'] | undefined;
  locale: Locale;
}) {
  const { t } = useTranslation('insights');
  const body = textOf(briefing, locale);
  const title = t('briefingTitle');
  const lines = briefingLines(body, title);
  if (!body && !briefing) {
    return null;
  }
  return (
    <section
      aria-label={title}
      className="overflow-hidden rounded-[18px] border border-line bg-surface"
    >
      <div className="flex items-center justify-between gap-3 bg-gradient-to-br from-[#173E2C] to-[#255642] px-4 py-4 text-primary-foreground">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-white/10 text-[#B9E7CE]">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
            </svg>
          </span>
          <h2 className="text-base font-bold leading-tight">{title}</h2>
        </div>
        {briefing?.source === 'llm' ? (
          <span className="shrink-0 rounded-lg bg-white/15 px-2 py-1 text-xs font-semibold">
            {t('ai')}
          </span>
        ) : null}
      </div>
      {lines.length > 0 ? (
        <ul className="grid gap-3 p-4">
          {lines.map((line, index) => (
            <li
              key={`${index}-${line}`}
              className="border-l-2 border-primary pl-3 text-sm font-medium leading-relaxed text-ink"
            >
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
