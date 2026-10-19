import { useTranslation } from 'react-i18next';
import { ProductMark } from '../../components/ProductMark';
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
  const attention = items.filter((item) => item.status === 'low' || item.status === 'out');
  return (
    <section aria-label={t('stock')} className="grid gap-3">
      <h2 className="text-sm font-bold">{t('stock')}</h2>
      {items.length === 0 ? <p className="text-muted">{t('emptyStock')}</p> : null}
      {attention.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2">
          {attention.slice(0, 3).map((item) => {
            const name = localizedName(item, locale);
            return (
              <li
                key={item.productId}
                className="min-w-0 rounded-[14px] border border-line bg-surface p-3"
              >
                <ProductMark name={name} />
                <p className="mt-2 truncate text-xs font-bold">{name}</p>
                <p className="mt-1 truncate text-xs font-bold text-warning">
                  {t(badgeKey[item.status])}
                </p>
              </li>
            );
          })}
        </ul>
      ) : null}
      {items.length > 0 ? (
        <ul className="overflow-hidden rounded-card border border-line bg-surface">
          {items.map((item) => {
            const name = localizedName(item, locale);
            return (
              <li
                key={item.productId}
                className="flex min-h-12 items-center gap-3 border-b border-line px-3 py-3 last:border-b-0"
              >
                <ProductMark name={name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{name}</span>
                  <span className="text-xs text-muted">
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
      ) : null}
    </section>
  );
}
