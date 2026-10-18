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
    <ul className="mt-4 grid gap-2">
      {products.map((product) => {
        const name = displayName(product, locale);
        return (
          <li key={product.id} className="flex items-stretch gap-2">
            <button
              type="button"
              className="flex min-h-control min-w-0 flex-1 flex-col items-start justify-center gap-1 rounded-card border border-line bg-surface px-3 py-2 text-left"
              onClick={() => onEdit(product)}
            >
              <span className="flex w-full items-baseline justify-between gap-3">
                <span className="truncate font-semibold">{name}</span>
                <span className="shrink-0">{formatMoney(product.price, locale)}</span>
              </span>
              <span
                data-stock={product.stockStatus}
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${stockClass[product.stockStatus]}`}
              >
                {t(stockKey[product.stockStatus])}
              </span>
            </button>
            <button
              type="button"
              className="inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-card border border-line px-2 text-sm font-semibold text-danger"
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
