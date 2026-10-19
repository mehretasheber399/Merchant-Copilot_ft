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
}: {
  products: ProductView[];
  onEdit: (product: ProductView) => void;
  onDelete: (product: ProductView) => void;
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
              <span className={`shrink-0 text-right ${stockClass[product.stockStatus]}`}>
                <span className="block text-sm font-bold">
                  {product.stock !== undefined ? product.stock : '–'}
                </span>
                <span data-stock={product.stockStatus} className="block text-[11px] font-semibold">
                  {t(stockKey[product.stockStatus])}
                </span>
              </span>
            </button>
            <button
              type="button"
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-[10px] bg-danger-soft px-3 text-sm font-bold text-danger"
              aria-label={`${t('remove')} ${name}`}
              onClick={() => onDelete(product)}
            >
              {t('remove')}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
