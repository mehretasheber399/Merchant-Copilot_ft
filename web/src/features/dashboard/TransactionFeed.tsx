import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import type { Locale, TransactionRow } from '../../shared/types';
import { formatMoney, formatTime } from '../../utils/format';
import { mappingKind } from './logic';

const badgeClass = {
  matched: 'text-success',
  estimate: 'text-warning',
  review: 'text-danger',
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
    <section aria-label={t('feed')} className="grid gap-3">
      <h2 className="text-sm font-bold">{t('feed')}</h2>
      {rows.length === 0 ? <p className="text-muted">{t('emptyFeed')}</p> : null}
      {rows.length > 0 ? (
        <ul className="overflow-hidden rounded-card border border-line bg-surface">
          {rows.map((row) => {
            const kind = mappingKind(row.mappingSource);
            const flashing = flashIds.includes(row.id);
            const title =
              row.phoneMasked ||
              (row.items[0] ? t('line', { name: row.items[0].name, qty: row.items[0].qty }) : '');
            return (
              <li
                key={row.id}
                data-flash={flashing ? 'true' : undefined}
                className={`flex items-center gap-3 border-b border-line px-3 py-3 last:border-b-0 ${flashing ? 'bg-primary-soft' : ''}`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-primary-soft text-primary">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
                    <path d="M9 8h6M9 12h6" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  {title ? (
                    <span className="block truncate text-sm font-semibold">{title}</span>
                  ) : null}
                  <span className="block text-xs text-muted">
                    {formatTime(row.timestamp, locale)}
                  </span>
                  {row.items.length > 1 ? (
                    <span className="block truncate text-xs text-muted">
                      {row.items
                        .map((item) => t('line', { name: item.name, qty: item.qty }))
                        .join(', ')}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-bold tabular-nums">
                    {formatMoney(row.amount, locale)}
                  </span>
                  <span className={`text-xs font-semibold ${badgeClass[kind]}`}>
                    {t(badgeKey[kind])}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
      {hasMore ? (
        <Button loading={loadingMore} onClick={onMore}>
          {t('loadMore')}
        </Button>
      ) : null}
    </section>
  );
}
