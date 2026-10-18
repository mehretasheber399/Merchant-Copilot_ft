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
  const [category, setCategory] = useState('all');
  const categories = [
    ...new Set(products.map((product) => product.category.trim()).filter(Boolean)),
  ];
  const visible = filterProducts(products, search).filter(
    (product) => category === 'all' || product.category === category,
  );

  return (
    <div>
      <label className="grid gap-1 text-sm font-semibold">
        {t('sale:search')}
        <input
          className="min-h-[52px] rounded-2xl border border-line bg-surface px-4 text-base font-medium"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      {categories.length > 0 ? (
        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button
            type="button"
            aria-pressed={category === 'all'}
            className={`inline-flex min-h-12 shrink-0 items-center rounded-full border px-4 text-sm font-semibold ${category === 'all' ? 'border-primary bg-primary text-primary-foreground shadow-shell' : 'border-line bg-surface text-muted'}`}
            onClick={() => setCategory('all')}
          >
            {t('sale:all')}
          </button>
          {categories.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={category === name}
              className={`inline-flex min-h-12 shrink-0 items-center rounded-full border px-4 text-sm font-semibold ${category === name ? 'border-primary bg-primary text-primary-foreground shadow-shell' : 'border-line bg-surface text-muted'}`}
              onClick={() => setCategory(name)}
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}
      {visible.length === 0 ? <p className="mt-6">{t('sale:noResults')}</p> : null}
      <ul className="mt-4 grid gap-3">
        {visible.map((product) => {
          const name = productName(product, locale);
          const qty = lines.find((line) => line.productId === product.id)?.qty ?? 0;
          const short = isStockShort(product, qty);
          return (
            <li key={product.id} className="rounded-card border border-line bg-surface p-3">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-lg font-extrabold text-primary"
                >
                  {name.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{name}</p>
                  <p className="truncate text-sm text-muted">
                    {product.category}
                    {product.stock !== undefined ? ` · ${product.stock}` : ''}
                  </p>
                  <p className="font-extrabold tabular-nums text-primary">
                    {formatMoney(product.price, locale)}
                  </p>
                  <span
                    data-stock={product.stockStatus}
                    className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${stockClass[product.stockStatus]}`}
                  >
                    {t(`items:${stockKey[product.stockStatus]}`)}
                  </span>
                </div>
                {qty === 0 ? (
                  <button
                    type="button"
                    className="inline-flex h-12 min-w-[76px] shrink-0 items-center justify-center rounded-full bg-primary px-5 font-bold text-primary-foreground active:scale-95"
                    onClick={() => onAdd(product.id, product.price)}
                  >
                    {t('sale:add')}
                  </button>
                ) : (
                  <div className="flex shrink-0 items-center gap-1 rounded-full bg-primary-soft p-1">
                    <button
                      type="button"
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface text-xl font-extrabold text-primary"
                      aria-label={t('sale:decrease', { name })}
                      onClick={() => onChange(product.id, -1)}
                    >
                      −
                    </button>
                    <span className="min-w-[22px] text-center font-bold tabular-nums">{qty}</span>
                    <button
                      type="button"
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface text-xl font-extrabold text-primary disabled:opacity-60"
                      aria-label={t('sale:increase', { name })}
                      disabled={qty >= 99}
                      onClick={() => onChange(product.id, 1)}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
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
