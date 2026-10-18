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
        <div className="grid gap-4">
          <section aria-label={t('calc')}>
            <h3 className="text-lg font-semibold">{t('calc')}</h3>
            {calc.length === 0 ? (
              <p className="mt-2">{t('emptyCalc')}</p>
            ) : (
              <dl className="mt-2 grid gap-2">
                {calc.map((step, index) => (
                  <div key={`${textOf(step.label, locale)}-${index}`} className="min-w-0">
                    <dt className="break-words text-sm font-semibold text-muted">
                      {textOf(step.label, locale)}
                    </dt>
                    <dd className="break-words text-base font-semibold">
                      {formatCalcValue(step.value)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
          <section aria-label={t('supporting')}>
            <h3 className="text-lg font-semibold">{t('supporting')}</h3>
            {transactions.length === 0 ? (
              <p className="mt-2">{t('emptyEvidence')}</p>
            ) : (
              <ul className="mt-2 grid gap-2">
                {transactions.map((row) => (
                  <li key={row.id} className="rounded-control border border-line px-3 py-2">
                    <p className="font-semibold">{formatMoney(row.amount, locale)}</p>
                    <p className="text-sm text-muted">{formatTime(row.timestamp, locale)}</p>
                    {(row.items ?? []).length > 0 ? (
                      <ul className="mt-1 text-sm">
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
