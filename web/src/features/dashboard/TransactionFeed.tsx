import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import type { Locale, TransactionRow } from '../../shared/types';
import { formatMoney, formatTime } from '../../utils/format';
import { mappingKind } from './logic';

const badgeClass = {
  matched: 'bg-success-soft text-success',
  estimate: 'bg-warning-soft text-warning',
  review: 'bg-danger-soft text-danger',
} as const;

const badgeKey = {
  matched: 'matched',
  estimate: 'estimate',
  review: 'needsReview',
} as const;

export function TransactionFeed({
  rows,
  locale,
  flashIds,
  hasMore,
  loadingMore,
  onMore,
}: {
  rows: TransactionRow[];
  locale: Locale;
  flashIds: string[];
  hasMore: boolean;
  loadingMore: boolean;
  onMore: () => void;
}) {
  const { t } = useTranslation('dashboard');
  return (
    <section aria-label={t('feed')} className="rounded-card border border-line bg-surface p-4">
      <h2 className="text-base font-bold">{t('feed')}</h2>
      {rows.length === 0 ? <p className="mt-2 text-muted">{t('emptyFeed')}</p> : null}
      <ul className="mt-1">
        {rows.map((row) => {
          const kind = mappingKind(row.mappingSource);
          const flashing = flashIds.includes(row.id);
          return (
            <li
              key={row.id}
              data-flash={flashing ? 'true' : undefined}
              className={`border-b border-line py-3 last:border-b-0 ${flashing ? 'rounded-2xl bg-primary-soft px-3' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-extrabold tabular-nums text-primary">
                  {formatMoney(row.amount, locale)}
                </p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${badgeClass[kind]}`}>
                  {t(badgeKey[kind])}
                </span>
              </div>
              <p className="text-sm text-muted">{formatTime(row.timestamp, locale)}</p>
              {row.phoneMasked ? <p className="text-sm">{row.phoneMasked}</p> : null}
              {row.items.length > 0 ? (
                <ul className="mt-1 text-sm">
                  {row.items.map((item) => (
                    <li key={`${row.id}-${item.name}-${item.qty}`}>
                      {t('line', { name: item.name, qty: item.qty })}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
      {hasMore ? (
        <div className="mt-3">
          <Button loading={loadingMore} onClick={onMore}>
            {t('loadMore')}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
