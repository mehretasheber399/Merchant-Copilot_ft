import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import i18n from '../../i18n';
import type { Locale, ProductView, UnmappedTransaction } from '../../shared/types';
import { formatMoney, formatTime } from '../../utils/format';
import { EditItemsSheet } from './EditItemsSheet';
import { suggestionLines, type MappingErrorKey, type PickedLine } from './logic';

function messageFor(key: MappingErrorKey): string {
  if (key === 'network') {
    return i18n.t('errors:network');
  }
  if (key === 'generic') {
    return i18n.t('errors:generic');
  }
  return i18n.t(`insights:${key}`);
}

export function ReviewList({
  locale,
  online,
  review,
  products,
  editingId,
  onEdit,
  confirm,
  confirmError,
  dismiss,
  dismissErrorKey,
}: {
  locale: Locale;
  online: boolean;
  review: UseQueryResult<UnmappedTransaction[]>;
  products: UseQueryResult<ProductView[]>;
  editingId: string | null;
  onEdit: (id: string | null) => void;
  confirm: UseMutationResult<
    { id: string; mappingSource: 'manual' },
    unknown,
    { id: string; items: PickedLine[] }
  >;
  confirmError: { id: string; key: MappingErrorKey } | null;
  dismiss: UseMutationResult<{ id: string; dismissed: true }, unknown, string>;
  dismissErrorKey: MappingErrorKey | null;
}) {
  const { t } = useTranslation('insights');
  const [askingId, setAskingId] = useState<string | null>(null);
  const rows = review.data ?? [];
  const editing = rows.find((row) => row.id === editingId) ?? null;

  return (
    <section aria-label={t('review')} className="grid gap-3">
      <h2 className="text-base font-bold">{t('review')}</h2>
      {!online && !review.data ? (
        <p role="status" className="font-semibold text-warning">
          {i18n.t('common:offline')}
        </p>
      ) : null}
      {online && review.isPending && !review.data ? (
        <div aria-busy="true">
          <p className="sr-only" role="status">
            {i18n.t('common:loading')}
          </p>
          <div className="h-24 animate-pulse rounded-card bg-canvas" />
        </div>
      ) : null}
      {online && review.isError && !review.data ? (
        <div className="grid gap-3">
          <p role="alert">{i18n.t('errors:network')}</p>
          <Button onClick={() => void review.refetch()}>{i18n.t('errors:retry')}</Button>
        </div>
      ) : null}
      {review.isSuccess && rows.length === 0 ? <p>{t('emptyReview')}</p> : null}
      <ul className="grid gap-3">
        {rows.map((row) => {
          const suggestion = row.suggestion;
          const asking = askingId === row.id;
          const error =
            editingId === row.id
              ? null
              : confirmError?.id === row.id
                ? messageFor(confirmError.key)
                : dismiss.isError && dismiss.variables === row.id && dismissErrorKey
                  ? messageFor(dismissErrorKey)
                  : null;
          return (
            <li key={row.id} className="min-w-0 rounded-card border border-line bg-surface p-4">
              <div>
                <p className="font-extrabold tabular-nums text-primary">
                  {formatMoney(row.amount, locale)}
                </p>
                <p className="text-sm text-muted">{formatTime(row.timestamp, locale)}</p>
                {row.phoneMasked ? <p className="text-sm">{row.phoneMasked}</p> : null}
                {suggestion ? (
                  <ul className="mt-2 text-sm">
                    {suggestion.items.map((item) => (
                      <li key={`${row.id}-${item.productId}`}>
                        {t('line', { name: item.name, qty: item.qty })}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2">{t('noMatch')}</p>
                )}
                {error ? (
                  <p role="alert" className="mt-2 font-semibold text-danger">
                    {error}
                  </p>
                ) : null}
                {asking ? (
                  <div className="mt-3 grid gap-2">
                    <p>{t('dismissAsk')}</p>
                    <Button
                      variant="danger"
                      loading={dismiss.isPending && dismiss.variables === row.id}
                      onClick={() => {
                        setAskingId(null);
                        dismiss.mutate(row.id);
                      }}
                    >
                      {t('dismiss')}
                    </Button>
                    <Button variant="secondary" onClick={() => setAskingId(null)}>
                      {t('cancel')}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-3 grid gap-2">
                    {suggestion ? (
                      <Button
                        loading={confirm.isPending && confirm.variables?.id === row.id}
                        onClick={() =>
                          confirm.mutate({ id: row.id, items: suggestionLines(suggestion) })
                        }
                      >
                        {t('confirm')}
                      </Button>
                    ) : null}
                    <Button variant="secondary" onClick={() => onEdit(row.id)}>
                      {t('edit')}
                    </Button>
                    <Button variant="secondary" onClick={() => setAskingId(row.id)}>
                      {t('dismiss')}
                    </Button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <EditItemsSheet
        open={Boolean(editing)}
        locale={locale}
        amount={editing?.amount ?? 0}
        suggestion={editing?.suggestion ?? null}
        products={products.data ?? []}
        productsLoading={products.isPending}
        pending={confirm.isPending && confirm.variables?.id === editing?.id}
        error={editing && confirmError?.id === editing.id ? messageFor(confirmError.key) : null}
        onClose={() => onEdit(null)}
        onConfirm={(items) => {
          if (editing) {
            confirm.mutate({ id: editing.id, items });
          }
        }}
      />
    </section>
  );
}
