import { useTranslation } from 'react-i18next';
import type { UseQueryResult } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import i18n from '../../i18n';
import type { InsightEvidence, Locale } from '../../shared/types';
import { formatMoney, formatTime } from '../../utils/format';
import { formatCalcValue, textOf } from './logic';

export function EvidenceDrawer({
  open,
  locale,
  evidence,
  onClose,
}: {
  open: boolean;
  locale: Locale;
  evidence: UseQueryResult<InsightEvidence>;
  onClose: () => void;
}) {
  const { t } = useTranslation('insights');
  const data = evidence.data;
  const calc = data?.calc ?? data?.insight?.calc ?? [];
  const transactions = data?.transactions ?? [];

  return (
    <Sheet open={open} title={t('evidence')} onClose={onClose} swipeClose>
      {evidence.isPending ? (
        <div aria-busy="true">
          <p className="sr-only" role="status">
            {i18n.t('common:loading')}
          </p>
          <div className="h-24 animate-pulse rounded-card bg-canvas" />
        </div>
      ) : null}
      {evidence.isError ? (
        <div className="grid gap-3">
          <p role="alert">{i18n.t('errors:network')}</p>
          <Button onClick={() => void evidence.refetch()}>{i18n.t('errors:retry')}</Button>
        </div>
      ) : null}
      {evidence.isSuccess ? (
        <div className="grid gap-5">
          <section aria-label={t('calc')}>
            <h3 className="text-sm font-bold text-muted">{t('calc')}</h3>
            {calc.length === 0 ? (
              <p className="mt-2 text-sm">{t('emptyCalc')}</p>
            ) : (
              <ul className="mt-3 grid grid-cols-2 gap-2">
                {calc.map((step, index) => (
                  <li
                    key={`${textOf(step.label, locale)}-${index}`}
                    className="rounded-2xl bg-primary-soft px-3 py-4 text-center"
                  >
                    <p className="text-2xl font-extrabold tabular-nums text-primary">
                      {formatCalcValue(step.value)}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                      {textOf(step.label, locale)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section aria-label={t('supporting')}>
            <h3 className="text-sm font-bold text-muted">{t('supporting')}</h3>
            {transactions.length === 0 ? (
              <p className="mt-2 text-sm">{t('emptyEvidence')}</p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {transactions.map((row) => (
                  <li key={row.id} className="rounded-2xl border border-line bg-surface px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-lg font-extrabold tabular-nums text-primary">
                        {formatMoney(row.amount, locale)}
                      </p>
                      <p className="text-xs text-muted">{formatTime(row.timestamp, locale)}</p>
                    </div>
                    {(row.items ?? []).length > 0 ? (
                      <ul className="mt-2 grid gap-1 text-sm text-muted">
                        {row.items.map((item) => (
                          <li key={`${row.id}-${item.name}-${item.qty}`}>
                            {t('line', { name: item.name, qty: item.qty })}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </Sheet>
  );
}
