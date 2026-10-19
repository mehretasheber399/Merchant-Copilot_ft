import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import type { InsightView, Locale } from '../../shared/types';
import { InsightIcon } from './InsightIcon';
import { canSeeEvidence, formatCalcValue, simpleCalcLabel, textOf } from './logic';

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
        const steps = (insight.calc ?? []).slice(0, 3);
        return (
          <li
            key={insight.id ?? `${insight.type}-${insight.dateKey}-${index}`}
            className="min-w-0 overflow-hidden rounded-[18px] border border-line bg-surface shadow-[0_8px_20px_rgba(23,50,36,0.04)]"
          >
            <div className="flex items-start gap-3 bg-gradient-to-br from-[#F3F8F5] to-surface px-4 pb-3 pt-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <InsightIcon type={insight.type} className="h-6 w-6 shrink-0" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-lg font-bold leading-snug">
                  {textOf(insight.what, locale)}
                </h2>
                {estimate ? (
                  <p className="mt-2 inline-flex min-h-8 items-center rounded-control border-2 border-dashed border-warning px-2 py-0.5 text-xs font-bold text-warning">
                    {t('confidenceEstimate')}
                  </p>
                ) : null}
              </div>
            </div>
            {steps.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 border-t border-line px-4 py-3">
                {steps.map((step, stepIndex) => {
                  const label = simpleCalcLabel(textOf(step.label, locale), t);
                  return (
                    <div
                      key={`${label}-${stepIndex}`}
                      className="min-w-0 rounded-xl bg-canvas px-2 py-2 text-center"
                    >
                      <p className="truncate text-base font-extrabold tabular-nums text-primary">
                        {formatCalcValue(step.value)}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] font-medium text-muted">{label}</p>
                    </div>
                  );
                })}
              </div>
            ) : null}
            <div className="grid gap-3 border-t border-line px-4 py-4">
              <p className="text-sm text-muted">
                <span className="font-bold text-ink">{t('check')}: </span>
                {textOf(insight.check, locale)}
              </p>
              <div className="rounded-2xl bg-primary-soft px-3 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  {t('next')}
                </p>
                <p className="mt-1 text-base font-bold leading-snug">
                  {textOf(insight.nextAction, locale)}
                </p>
              </div>
              {canSeeEvidence(insight) ? (
                <Button variant="secondary" onClick={() => onEvidence(insight.id as string)}>
                  {t('seeEvidence')}
                </Button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
