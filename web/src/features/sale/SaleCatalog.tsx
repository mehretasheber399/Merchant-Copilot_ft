import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProductMark } from '../../components/ProductMark';
import type { ProductView, StockStatus } from '../../shared/types';
import { useLocaleStore } from '../../store/locale';
import { formatMoney } from '../../utils/format';
import { filterProducts, isStockShort } from './logic';
import type { CartLine } from '../../store/cart';

const stockClass: Record<StockStatus, string> = {
  low: 'text-warning',
  out: 'text-danger',
  untracked: 'text-muted',
  ok: 'text-muted',
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
        <span className="sr-only">{t('sale:search')}</span>
        <span className="flex h-12 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-muted">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            className="min-w-0 flex-1 bg-transparent text-base font-medium text-ink outline-none"
            placeholder={t('sale:search')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </span>
      </label>
      {categories.length > 0 ? (
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
          <button
            type="button"
            aria-pressed={category === 'all'}
            className={`inline-flex min-h-12 shrink-0 items-center rounded-full border px-4 text-sm font-semibold ${category === 'all' ? 'border-primary bg-primary text-primary-foreground' : 'border-line bg-surface text-muted'}`}
            onClick={() => setCategory('all')}
          >
            {t('sale:all')}
          </button>
          {categories.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={category === name}
              className={`inline-flex min-h-12 shrink-0 items-center rounded-full border px-4 text-sm font-semibold ${category === name ? 'border-primary bg-primary text-primary-foreground' : 'border-line bg-surface text-muted'}`}
              onClick={() => setCategory(name)}
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}
      {visible.length === 0 ? <p className="mt-6">{t('sale:noResults')}</p> : null}
      <ul className="mt-3 grid grid-cols-2 gap-3">
        {visible.map((product) => {
          const name = productName(product, locale);
          const qty = lines.find((line) => line.productId === product.id)?.qty ?? 0;
          const short = isStockShort(product, qty);
          const selected = qty > 0;
          return (
            <li
              key={product.id}
              className={`min-w-0 rounded-2xl border bg-surface p-3 ${selected ? 'border-primary shadow-[inset_0_0_0_1px_#087A49]' : 'border-line'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <ProductMark name={name} large />
                <span
                  data-stock={product.stockStatus}
                  className={`text-right text-[11px] font-semibold ${stockClass[product.stockStatus]}`}
                >
                  {product.stock !== undefined ? product.stock : ''}{' '}
                  {t(`items:${stockKey[product.stockStatus]}`)}
                </span>
              </div>
              <p className="mt-3 truncate text-sm font-bold">{name}</p>
              <p className="truncate text-xs text-muted">{product.category}</p>
              <p className="mt-2 text-sm font-bold tabular-nums">
                {formatMoney(product.price, locale)}
              </p>
              {qty === 0 ? (
                <button
                  type="button"
                  className="mt-3 inline-flex h-12 w-full items-center justify-center gap-1 rounded-[10px] bg-primary-soft text-sm font-bold text-primary"
                  onClick={() => onAdd(product.id, product.price)}
                >
                  {t('sale:add')}
                </button>
              ) : (
                <div className="mt-3 grid h-12 grid-cols-[48px_1fr_48px] items-center rounded-[10px] bg-primary-soft text-primary">
                  <button
                    type="button"
                    className="grid h-12 place-items-center text-xl font-bold"
                    aria-label={t('sale:decrease', { name })}
                    onClick={() => onChange(product.id, -1)}
                  >
                    −
                  </button>
                  <span className="text-center text-sm font-bold tabular-nums">{qty}</span>
                  <button
                    type="button"
                    className="grid h-12 place-items-center text-xl font-bold disabled:opacity-60"
                    aria-label={t('sale:increase', { name })}
                    disabled={qty >= 99}
                    onClick={() => onChange(product.id, 1)}
                  >
                    +
                  </button>
                </div>
              )}
              {short ? (
                <p className="mt-2 text-xs font-semibold text-warning">
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
