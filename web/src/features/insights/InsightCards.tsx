import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import type { InsightView, Locale } from '../../shared/types';
import { InsightIcon } from './InsightIcon';
import { canSeeEvidence, textOf } from './logic';

function Block({ label, body, highlight }: { label: string; body: string; highlight?: boolean }) {
  return (
    <div className={highlight ? 'rounded-control bg-primary-soft p-3' : undefined}>
      <p
        className={
          highlight
            ? 'text-xs font-extrabold uppercase tracking-wide text-primary'
            : 'text-sm font-semibold text-muted'
        }
      >
        {label}
      </p>
      <p className="mt-1 break-words">{body}</p>
    </div>
  );
}

export function InsightCards({
  insights,
  locale,
  onEvidence,
}: {
  insights: InsightView[];
  locale: Locale;
  onEvidence: (id: string) => void;
}) {
  const { t } = useTranslation('insights');
  if (insights.length === 0) {
    return <p>{t('emptyInsights')}</p>;
  }
  return (
    <ul className="grid gap-3">
      {insights.map((insight, index) => {
        const estimate = insight.confidence === 'estimate';
        return (
          <li
            key={insight.id ?? `${insight.type}-${insight.dateKey}-${index}`}
            className="min-w-0 rounded-card border border-line bg-surface p-4"
          >
            <div>
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-soft">
                  <InsightIcon type={insight.type} className="h-6 w-6 shrink-0 text-primary" />
                </span>
                <h2 className="min-w-0 break-words text-lg font-bold">
                  {textOf(insight.what, locale)}
                </h2>
              </div>
              <div className="mt-3 grid gap-3">
                <Block label={t('why')} body={textOf(insight.why, locale)} />
                <Block label={t('check')} body={textOf(insight.check, locale)} />
                <Block label={t('next')} body={textOf(insight.nextAction, locale)} highlight />
              </div>
              <p
                className={`mt-3 inline-flex min-h-8 items-center rounded-control border-2 px-2 py-1 text-sm font-semibold ${
                  estimate
                    ? 'border-dashed border-warning text-warning'
                    : 'border-solid border-success text-success'
                }`}
              >
                {estimate ? t('confidenceEstimate') : t('confidenceHigh')}
              </p>
              {canSeeEvidence(insight) ? (
                <div className="mt-3">
                  <Button variant="secondary" onClick={() => onEvidence(insight.id as string)}>
                    {t('seeEvidence')}
                  </Button>
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
