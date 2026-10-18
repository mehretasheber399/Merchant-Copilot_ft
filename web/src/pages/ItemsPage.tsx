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
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <label className="mt-4 grid gap-1 text-sm font-semibold">
        {t('search')}
        <input
          className="min-h-control rounded-control border border-line bg-surface px-3 text-base font-normal"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <div className="mt-3">
        <Button onClick={() => setEditing(null)}>{t('add')}</Button>
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
