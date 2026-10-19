import { useTranslation } from 'react-i18next';
import { ProductMark } from '../../components/ProductMark';
import { formatMoney } from '../../utils/format';
import { useLocaleStore } from '../../store/locale';
import type { ProductView, StockStatus } from '../../shared/types';
import { displayName } from './form';

const stockClass: Record<StockStatus, string> = {
  low: 'text-warning',
  out: 'text-danger',
  untracked: 'text-muted',
  ok: 'text-success',
};

const stockKey = {
  low: 'stockLow',
  out: 'stockOut',
  untracked: 'stockUntracked',
  ok: 'stockOk',
} as const;

export function ProductList({
  products,
  onEdit,
  onDelete,
  onStock,
}: {
  products: ProductView[];
  onEdit: (product: ProductView) => void;
  onDelete: (product: ProductView) => void;
  onStock: (product: ProductView, delta: number) => void;
}) {
  const { t } = useTranslation('items');
  const locale = useLocaleStore((state) => state.locale);

  return (
    <ul className="mt-4 overflow-hidden rounded-card border border-line bg-surface">
      {products.map((product) => {
        const name = displayName(product, locale);
        return (
          <li
            key={product.id}
            className="flex items-center gap-3 border-b border-line px-3 py-3 last:border-b-0"
          >
            <button
              type="button"
              className="flex min-h-12 min-w-0 flex-1 items-center gap-3 text-left"
              onClick={() => onEdit(product)}
            >
              <ProductMark name={name} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{name}</span>
                <span className="block truncate text-xs text-muted">
                  {formatMoney(product.price, locale)}
                  {product.category.trim() ? ` · ${product.category}` : ''}
                </span>
              </span>
              <span
                data-stock={product.stockStatus}
                className={`shrink-0 text-[11px] font-semibold ${stockClass[product.stockStatus]}`}
              >
                {t(stockKey[product.stockStatus])}
              </span>
            </button>
            <div className="flex shrink-0 items-center gap-1">
              <div className="grid h-12 grid-cols-[48px_2rem_48px] items-center rounded-full bg-canvas text-ink">
                <button
                  type="button"
                  className="grid h-12 place-items-center text-xl font-bold disabled:opacity-40"
                  aria-label={t('decreaseStock', { name })}
                  disabled={(product.stock ?? 0) <= 0}
                  onClick={() => onStock(product, -1)}
                >
                  −
                </button>
                <span className="text-center text-sm font-bold tabular-nums">
                  {product.stock !== undefined ? product.stock : '–'}
                </span>
                <button
                  type="button"
                  className="grid h-12 place-items-center text-xl font-bold"
                  aria-label={t('increaseStock', { name })}
                  onClick={() => onStock(product, 1)}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                className="grid h-12 w-12 place-items-center rounded-full bg-canvas text-muted"
                aria-label={t('options', { name })}
                onClick={() => onDelete(product)}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
