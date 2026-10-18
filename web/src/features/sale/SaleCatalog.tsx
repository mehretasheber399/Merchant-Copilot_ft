import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProductView, StockStatus } from '../../shared/types';
import { useLocaleStore } from '../../store/locale';
import { formatMoney } from '../../utils/format';
import { filterProducts, isStockShort } from './logic';
import type { CartLine } from '../../store/cart';

const stockClass: Record<StockStatus, string> = {
  low: 'bg-warning-soft text-warning',
  out: 'bg-danger-soft text-danger',
  untracked: 'border border-line bg-canvas text-muted',
  ok: 'bg-success-soft text-success',
};

const stockKey = {
  low: 'stockLow',
  out: 'stockOut',
  untracked: 'stockUntracked',
  ok: 'stockOk',
} as const;

function productName(product: ProductView, locale: 'en' | 'am'): string {
  if (locale === 'am' && product.nameAm.trim()) {
    return product.nameAm;
  }
  return product.name;
}

export function SaleCatalog({
  products,
  lines,
  onAdd,
  onChange,
}: {
  products: ProductView[];
  lines: CartLine[];
  onAdd: (productId: string, price: number) => void;
  onChange: (productId: string, delta: number) => void;
}) {
  const { t } = useTranslation(['sale', 'items']);
  const locale = useLocaleStore((state) => state.locale);
  const [search, setSearch] = useState('');
  const visible = filterProducts(products, search);

  return (
    <div>
      <label className="grid gap-1 text-sm font-semibold">
        {t('sale:search')}
        <input
          className="min-h-control rounded-control border border-line bg-surface px-3 text-base font-normal"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      {visible.length === 0 ? <p className="mt-6">{t('sale:noResults')}</p> : null}
      <ul className="mt-4 grid gap-3">
        {visible.map((product) => {
          const name = productName(product, locale);
          const qty = lines.find((line) => line.productId === product.id)?.qty ?? 0;
          const short = isStockShort(product, qty);
          return (
            <li key={product.id} className="rounded-card border border-line p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{name}</p>
                  <p className="text-sm">{formatMoney(product.price, locale)}</p>
                </div>
                <span
                  data-stock={product.stockStatus}
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${stockClass[product.stockStatus]}`}
                >
                  {t(`items:${stockKey[product.stockStatus]}`)}
                </span>
              </div>
              {qty === 0 ? (
                <button
                  type="button"
                  className="mt-3 inline-flex min-h-control w-full items-center justify-center rounded-control bg-primary px-4 font-semibold text-primary-foreground"
                  onClick={() => onAdd(product.id, product.price)}
                >
                  {t('sale:add')}
                </button>
              ) : (
                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-control border border-line text-xl font-semibold"
                    aria-label={t('sale:decrease', { name })}
                    onClick={() => onChange(product.id, -1)}
                  >
                    −
                  </button>
                  <span className="text-lg font-semibold">{qty}</span>
                  <button
                    type="button"
                    className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-control border border-line text-xl font-semibold disabled:opacity-60"
                    aria-label={t('sale:increase', { name })}
                    disabled={qty >= 99}
                    onClick={() => onChange(product.id, 1)}
                  >
                    +
                  </button>
                </div>
              )}
              {short ? (
                <p className="mt-2 text-sm font-semibold text-warning">
                  {t('sale:stockWarning', { count: product.stock ?? 0 })}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
