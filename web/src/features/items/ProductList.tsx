import { useTranslation } from 'react-i18next';
import { formatMoney } from '../../utils/format';
import { useLocaleStore } from '../../store/locale';
import type { ProductView, StockStatus } from '../../shared/types';
import { displayName } from './form';

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
    <ul className="mt-4 grid gap-3">
      {products.map((product) => {
        const name = displayName(product, locale);
        const meta = [
          product.category.trim(),
          product.stock !== undefined ? String(product.stock) : '',
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <li
            key={product.id}
            className="flex items-center gap-3 rounded-card border border-line bg-surface p-3"
          >
            <button
              type="button"
              className="flex min-h-12 min-w-0 flex-1 items-center gap-3 text-left"
              onClick={() => onEdit(product)}
            >
              <span
                aria-hidden="true"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-lg font-extrabold text-primary"
              >
                {name.slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{name}</span>
                {meta ? <span className="block truncate text-sm text-muted">{meta}</span> : null}
                <span className="block font-extrabold tabular-nums text-primary">
                  {formatMoney(product.price, locale)}
                </span>
                <span
                  data-stock={product.stockStatus}
                  className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${stockClass[product.stockStatus]}`}
                >
                  {t(stockKey[product.stockStatus])}
                </span>
              </span>
            </button>
            <button
              type="button"
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-danger-soft px-4 text-sm font-bold text-danger"
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
