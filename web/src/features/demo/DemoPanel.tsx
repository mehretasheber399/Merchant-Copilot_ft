import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  drainStock,
  listProducts,
  resetDemo,
  simulateDirectPayment,
  simulateSale,
} from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { useHost } from '../../host/host';
import { useOnline } from '../../hooks/useOnline';
import i18n from '../../i18n';
import { useLocaleStore } from '../../store/locale';
import { formatMoney } from '../../utils/format';

function demoMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return i18n.t('demo:unavailable');
  }
  if (
    error instanceof ApiError &&
    (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT' || error.status === 0)
  ) {
    return i18n.t('errors:network');
  }
  return i18n.t('errors:generic');
}

export function DemoPanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('demo');
  const host = useHost();
  const client = useQueryClient();
  const locale = useLocaleStore((state) => state.locale);
  const online = useOnline();
  const [confirmReset, setConfirmReset] = useState(false);
  const [productId, setProductId] = useState('');
  const products = useQuery({
    queryKey: ['products', ''],
    queryFn: () => listProducts({ limit: 100, activeOnly: true }),
    enabled: online,
    staleTime: 10_000,
    refetchIntervalInBackground: false,
  });

  const fail = (error: unknown) => host.toast(demoMessage(error), 'danger');

  const reset = useMutation({
    mutationFn: resetDemo,
    onSuccess: (result) => {
      client.clear();
      setConfirmReset(false);
      host.toast(t('resetDone', { total: formatMoney(result.todayTotal, locale) }), 'success');
    },
    onError: fail,
  });
  const sale = useMutation({
    mutationFn: () => simulateSale(),
    onSuccess: (created) => {
      host.toast(t('saleReady', { amount: formatMoney(created.amount, locale) }), 'success');
    },
    onError: fail,
  });
  const payment = useMutation({
    mutationFn: () => simulateDirectPayment(),
    onSuccess: (created) => {
      host.toast(t('paymentReady', { amount: formatMoney(created.amount, locale) }), 'success');
      onClose();
      host.navigate('/insights');
    },
    onError: fail,
  });
  const drain = useMutation({
    mutationFn: () => drainStock(productId),
    onSuccess: (result) => {
      void client.invalidateQueries({ queryKey: ['products'] });
      void client.invalidateQueries({ queryKey: ['stock'] });
      host.toast(t('drained', { count: result.stock }), 'warning');
    },
    onError: fail,
  });

  const busy = reset.isPending || sale.isPending || payment.isPending || drain.isPending;
  const catalog = products.data ?? [];

  return (
    <section aria-label={t('title')} className="grid gap-3 rounded-card border border-line p-3">
      <h2 className="text-lg font-semibold">{t('title')}</h2>
      {confirmReset ? (
        <div className="grid gap-2">
          <p>{t('resetAsk')}</p>
          <Button loading={reset.isPending} disabled={busy} onClick={() => reset.mutate()}>
            {t('resetYes')}
          </Button>
          <Button variant="secondary" disabled={busy} onClick={() => setConfirmReset(false)}>
            {t('cancel')}
          </Button>
        </div>
      ) : (
        <Button variant="danger" disabled={busy} onClick={() => setConfirmReset(true)}>
          {t('reset')}
        </Button>
      )}
      <Button
        variant="secondary"
        loading={sale.isPending}
        disabled={busy}
        onClick={() => sale.mutate()}
      >
        {t('simulateSale')}
      </Button>
      <Button
        variant="secondary"
        loading={payment.isPending}
        disabled={busy}
        onClick={() => payment.mutate()}
      >
        {t('direct')}
      </Button>
      <label className="grid gap-1 text-sm font-semibold">
        {t('drainPick')}
        <select
          className="min-h-control w-full rounded-control border border-line bg-surface px-3 font-normal"
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
        >
          <option value="">{t('drainPick')}</option>
          {catalog.map((product) => (
            <option key={product.id} value={product.id}>
              {locale === 'am' && product.nameAm.trim() ? product.nameAm : product.name}
            </option>
          ))}
        </select>
      </label>
      {!online ? (
        <p role="status" className="font-semibold text-warning">
          {i18n.t('common:offline')}
        </p>
      ) : null}
      {online && products.isPending ? <p role="status">{i18n.t('common:loading')}</p> : null}
      {online && products.isError ? (
        <div className="grid gap-2">
          <p role="alert">{i18n.t('errors:network')}</p>
          <Button variant="secondary" onClick={() => void products.refetch()}>
            {i18n.t('errors:retry')}
          </Button>
        </div>
      ) : null}
      {products.isSuccess && catalog.length === 0 ? <p>{t('emptyProducts')}</p> : null}
      <Button
        variant="secondary"
        loading={drain.isPending}
        disabled={busy || !productId}
        onClick={() => drain.mutate()}
      >
        {t('drain')}
      </Button>
    </section>
  );
}
