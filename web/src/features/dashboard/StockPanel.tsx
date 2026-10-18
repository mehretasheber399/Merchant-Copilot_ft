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
    <section aria-label={t('stock')}>
      <h2 className="text-lg font-semibold">{t('stock')}</h2>
      {items.length === 0 ? <p className="mt-2">{t('emptyStock')}</p> : null}
      <ul className="mt-2 grid gap-2">
        {items.map((item) => (
          <li
            key={item.productId}
            className="flex min-h-control items-center justify-between gap-3 rounded-card border border-line px-3 py-2"
          >
            <span className="min-w-0">
              <span className="block font-semibold">{localizedName(item, locale)}</span>
              <span className="text-sm text-muted">
                {item.daysOfStockLeft === null || item.daysOfStockLeft === undefined
                  ? t('noSalesData')
                  : t('daysLeft', { count: item.daysOfStockLeft })}
              </span>
            </span>
            <span
              className={`shrink-0 rounded-control px-2 py-1 text-sm font-semibold ${badgeClass[item.status]}`}
            >
              {t(badgeKey[item.status])}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
