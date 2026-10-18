import { useTranslation } from 'react-i18next';
import type { Locale, StockItem } from '../../shared/types';
import { localizedName } from './logic';

const badgeClass = {
  low: 'bg-warning-soft text-warning',
  out: 'bg-danger-soft text-danger',
  ok: 'bg-success-soft text-success',
} as const;

const badgeKey = {
  low: 'stockLow',
  out: 'stockOut',
  ok: 'stockOk',
} as const;

export function StockPanel({ items, locale }: { items: StockItem[]; locale: Locale }) {
  const { t } = useTranslation('dashboard');
  return (
    <section aria-label={t('stock')} className="rounded-card border border-line bg-surface p-4">
      <h2 className="text-base font-bold">{t('stock')}</h2>
      {items.length === 0 ? <p className="mt-2 text-muted">{t('emptyStock')}</p> : null}
      <ul className="mt-1">
        {items.map((item) => {
          const name = localizedName(item, locale);
          return (
            <li
              key={item.productId}
              className="flex min-h-12 items-center gap-3 border-b border-line py-3 last:border-b-0"
            >
              <span
                aria-hidden="true"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-sm font-extrabold text-primary"
              >
                {name.slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{name}</span>
                <span className="text-sm text-muted">
                  {item.daysOfStockLeft === null || item.daysOfStockLeft === undefined
                    ? t('noSalesData')
                    : t('daysLeft', { count: item.daysOfStockLeft })}
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${badgeClass[item.status]}`}
              >
                {t(badgeKey[item.status])}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
