import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import type { Locale, ProductView, SuggestionCandidate } from '../../shared/types';
import { formatMoney } from '../../utils/format';
import {
  addPickedLine,
  canConfirmMapping,
  changePickedQty,
  removePickedLine,
  runningTotal,
  suggestionLines,
  type PickedLine,
} from './logic';

function productName(product: ProductView, locale: Locale): string {
  if (locale === 'am' && product.nameAm.trim()) {
    return product.nameAm;
  }
  return product.name;
}

export function EditItemsSheet({
  open,
  locale,
  amount,
  suggestion,
  products,
  productsLoading,
  pending,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean;
  locale: Locale;
  amount: number;
  suggestion: SuggestionCandidate | null;
  products: ProductView[];
  productsLoading: boolean;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (items: PickedLine[]) => void;
}) {
  const { t } = useTranslation('insights');
  const [lines, setLines] = useState<PickedLine[]>([]);

  useEffect(() => {
    if (open) {
      setLines(suggestionLines(suggestion));
    }
  }, [open, suggestion]);

  const priceOf = (productId: string) =>
    products.find((product) => product.id === productId)?.price ?? 0;
  const total = runningTotal(lines, priceOf);
  const ready = canConfirmMapping(total, amount, lines.length);

  return (
    <Sheet open={open} title={t('edit')} onClose={onClose}>
      <div className="grid gap-3">
        <p className="font-semibold" aria-live="polite">
          {t('totalOf', {
            running: formatMoney(total, locale),
            payment: formatMoney(amount, locale),
          })}
        </p>
        {productsLoading ? (
          <p role="status">{t('loadingItems')}</p>
        ) : (
          <select
            aria-label={t('addItem')}
            className="min-h-control w-full rounded-control border border-line bg-surface px-3"
            value=""
            onChange={(event) => {
              setLines((current) => addPickedLine(current, event.target.value));
            }}
          >
            <option value="">{t('addItem')}</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {productName(product, locale)}
              </option>
            ))}
          </select>
        )}
        <ul className="grid gap-2">
          {lines.map((line) => {
            const product = products.find((item) => item.id === line.productId);
            const name = product ? productName(product, locale) : line.productId;
            return (
              <li
                key={line.productId}
                className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-control border border-line px-3 py-2"
              >
                <p className="min-w-0 break-words font-semibold">{name}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex min-h-control min-w-12 items-center justify-center rounded-control border border-line font-semibold"
                    aria-label={t('decrease', { name })}
                    onClick={() =>
                      setLines((current) => changePickedQty(current, line.productId, line.qty - 1))
                    }
                  >
                    −
                  </button>
                  <span className="min-w-6 text-center font-semibold">{line.qty}</span>
                  <button
                    type="button"
                    className="inline-flex min-h-control min-w-12 items-center justify-center rounded-control border border-line font-semibold"
                    aria-label={t('increase', { name })}
                    onClick={() =>
                      setLines((current) => changePickedQty(current, line.productId, line.qty + 1))
                    }
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="col-span-2 min-h-control text-left text-sm font-semibold text-danger"
                  onClick={() => setLines((current) => removePickedLine(current, line.productId))}
                >
                  {t('remove', { name })}
                </button>
              </li>
            );
          })}
        </ul>
        {error ? (
          <p role="alert" className="font-semibold text-danger">
            {error}
          </p>
        ) : null}
        <Button loading={pending} disabled={!ready} onClick={() => onConfirm(lines)}>
          {t('confirm')}
        </Button>
      </div>
    </Sheet>
  );
}
