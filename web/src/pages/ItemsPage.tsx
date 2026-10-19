import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../api/client';
import { Button } from '../components/ui/Button';
import { Sheet } from '../components/ui/Sheet';
import { ProductFormSheet } from '../features/items/ProductFormSheet';
import { ProductList } from '../features/items/ProductList';
import { StarterSheet } from '../features/items/StarterSheet';
import { useDebounced } from '../hooks/useDebounced';
import { useOnline } from '../hooks/useOnline';
import { useDeleteProduct, useProductList } from '../hooks/useProducts';
import i18n from '../i18n';
import type { ProductView } from '../shared/types';

function errorText(error: unknown): string {
  if (error instanceof ApiError && (error.code === 'NETWORK_ERROR' || error.status === 0)) {
    return i18n.t('errors:network');
  }
  return i18n.t('errors:generic');
}

export function ItemsPage() {
  const { t } = useTranslation('items');
  const online = useOnline();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search.trim(), 300);
  const products = useProductList(debounced);
  const remove = useDeleteProduct();
  const [editing, setEditing] = useState<ProductView | null | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<ProductView | null>(null);
  const [starterOpen, setStarterOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const showStarter = !debounced && products.data?.length === 0;

  return (
    <section>
      <h1 className="sr-only">{t('title')}</h1>
      <div className="grid grid-cols-[1fr_48px] gap-2">
        <label className="grid gap-1 text-sm font-semibold">
          <span className="sr-only">{t('search')}</span>
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
              placeholder={t('search')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </span>
        </label>
        <button
          type="button"
          className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground"
          aria-label={t('add')}
          onClick={() => setEditing(null)}
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
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
      {products.data ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-[14px] border border-line bg-surface p-3">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-primary-soft text-primary">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z" />
              </svg>
            </span>
            <p>
              <strong className="block text-base leading-none">{products.data.length}</strong>
              <small className="text-xs text-muted">{t('summaryProducts')}</small>
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-[14px] border border-line bg-surface p-3">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-warning-soft text-warning">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M12 4 3 20h18L12 4Z" />
                <path d="M12 9v5M12 17h.01" />
              </svg>
            </span>
            <p>
              <strong className="block text-base leading-none">
                {
                  products.data.filter(
                    (product) => product.stockStatus === 'low' || product.stockStatus === 'out',
                  ).length
                }
              </strong>
              <small className="text-xs text-muted">{t('summaryLow')}</small>
            </p>
          </div>
        </div>
      ) : null}
      <div className="mt-3">
        <Button variant="secondary" onClick={() => setStarterOpen(true)}>
          {t('addFromStarter')}
        </Button>
      </div>
      {notice ? (
        <p role="status" className="mt-3 text-sm font-semibold text-success">
          {notice}
        </p>
      ) : null}

      {!online && !products.data ? (
        <p role="status" className="mt-6 font-semibold text-warning">
          {i18n.t('common:offline')}
        </p>
      ) : null}
      {online && products.isPending ? (
        <p role="status" className="mt-6">
          {i18n.t('common:loading')}
        </p>
      ) : null}
      {online && products.isError && !products.data ? (
        <div className="mt-6 grid gap-3">
          <p role="alert">{errorText(products.error)}</p>
          <Button onClick={() => void products.refetch()}>{i18n.t('errors:retry')}</Button>
        </div>
      ) : null}
      {showStarter ? (
        <div className="mt-6 grid gap-3">
          <p>{t('empty')}</p>
          <Button variant="secondary" onClick={() => setStarterOpen(true)}>
            {t('useStarter')}
          </Button>
        </div>
      ) : null}
      {products.data && products.data.length === 0 && debounced ? (
        <p className="mt-6">{t('noResults')}</p>
      ) : null}
      {products.data && products.data.length > 0 ? (
        <ProductList
          products={products.data}
          onEdit={(product) => setEditing(product)}
          onDelete={(product) => {
            setDeleteError('');
            setPendingDelete(product);
          }}
        />
      ) : null}

      <ProductFormSheet
        open={editing !== undefined}
        product={editing ?? null}
        onClose={() => setEditing(undefined)}
      />
      <StarterSheet
        open={starterOpen}
        onClose={() => setStarterOpen(false)}
        onDone={(message) => setNotice(message)}
      />
      <Sheet
        open={pendingDelete !== null}
        title={t('removeTitle')}
        onClose={() => setPendingDelete(null)}
      >
        <p>{t('removeBody')}</p>
        {deleteError ? (
          <p role="alert" className="mt-3 text-sm font-semibold text-danger">
            {deleteError}
          </p>
        ) : null}
        <div className="mt-4 grid gap-2">
          <Button
            variant="danger"
            loading={remove.isPending}
            onClick={() => {
              if (!pendingDelete) {
                return;
              }
              void remove
                .mutateAsync(pendingDelete.id)
                .then(() => setPendingDelete(null))
                .catch((error: unknown) => setDeleteError(errorText(error)));
            }}
          >
            {t('remove')}
          </Button>
          <Button variant="secondary" onClick={() => setPendingDelete(null)}>
            {t('cancel')}
          </Button>
        </div>
      </Sheet>
    </section>
  );
}
