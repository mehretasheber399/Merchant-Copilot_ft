import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import i18n from '../i18n';
import { useLocaleStore } from '../store/locale';
import { formatMoney } from '../utils/format';
import type { SaleFailure } from '../features/sale/errors';
import { cartTotal, isFinalStatus } from '../features/sale/logic';
import { SaleCatalog } from '../features/sale/SaleCatalog';
import { SaleResult } from '../features/sale/SaleResult';
import { useSaleScreen } from '../features/sale/useSaleScreen';
import { WaitingSale } from '../features/sale/WaitingSale';

function failureText(failure: SaleFailure): string {
  if (failure.kind === 'network') {
    return i18n.t('errors:network');
  }
  if (failure.kind === 'rate') {
    return i18n.t('sale:tooMany');
  }
  if (failure.kind === 'unavailable') {
    return i18n.t('sale:unavailable');
  }
  if (failure.kind === 'conflict') {
    return i18n.t('sale:cancelConflict');
  }
  if (failure.kind === 'validation') {
    return failure.issues.join(' ') || i18n.t('errors:validation');
  }
  return i18n.t('errors:generic');
}

export function SalePage() {
  const { t } = useTranslation('sale');
  const locale = useLocaleStore((state) => state.locale);
  const screen = useSaleScreen();
  const total = cartTotal(screen.lines);
  const sale = screen.sale;
  const showSale = Boolean(screen.requestId);

  return (
    <section className={screen.lines.length > 0 && !showSale ? 'pb-24' : undefined}>
      {!showSale ? <h1 className="mb-4 text-2xl font-semibold">{t('title')}</h1> : null}
      {!screen.online && !screen.products.data ? (
        <p role="status" className="font-semibold text-warning">
          {i18n.t('common:offline')}
        </p>
      ) : null}
      {screen.online && screen.products.isPending ? (
        <p role="status">{i18n.t('common:loading')}</p>
      ) : null}
      {screen.online && screen.products.isError && !screen.products.data ? (
        <div className="grid gap-3">
          <p role="alert">{i18n.t('errors:network')}</p>
          <Button onClick={() => void screen.products.refetch()}>{i18n.t('errors:retry')}</Button>
        </div>
      ) : null}
      {!showSale && screen.products.data && screen.products.data.length === 0 ? (
        <p>{t('empty')}</p>
      ) : null}
      {!showSale && screen.products.data && screen.products.data.length > 0 ? (
        <>
          <SaleCatalog
            products={screen.products.data}
            lines={screen.lines}
            onAdd={screen.add}
            onChange={screen.change}
          />
          <div className="mt-4 grid gap-3">
            <Input
              label={t('phone')}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={screen.phone}
              onChange={(event) => screen.setPhone(event.target.value)}
              error={screen.phoneError ? t('phoneInvalid') : undefined}
            />
            {screen.limitReached ? (
              <p className="text-sm font-semibold text-warning">{t('lineLimit')}</p>
            ) : null}
            {screen.failure ? (
              <p role="alert" className="text-sm font-semibold text-danger">
                {failureText(screen.failure)}
              </p>
            ) : null}
            <Button
              loading={screen.requesting}
              disabled={screen.lines.length === 0}
              onClick={screen.submit}
            >
              {t('request')}
            </Button>
          </div>
          {screen.lines.length > 0 ? (
            <div className="fixed bottom-[calc(56px+env(safe-area-inset-bottom))] left-1/2 z-20 flex min-h-nav w-full max-w-[420px] -translate-x-1/2 items-center justify-between border-t border-line bg-surface px-4">
              <span className="font-semibold">{t('total')}</span>
              <span className="font-semibold">{formatMoney(total, locale)}</span>
            </div>
          ) : null}
        </>
      ) : null}
      {showSale && !sale ? (
        screen.saleQuery.isError ? (
          <div className="grid gap-3">
            <p role="alert">{failureText({ kind: 'network' })}</p>
            <Button onClick={() => void screen.saleQuery.refetch()}>
              {i18n.t('errors:retry')}
            </Button>
            <Button variant="secondary" onClick={screen.newSale}>
              {t('clearSale')}
            </Button>
          </div>
        ) : (
          <p role="status">{i18n.t('common:loading')}</p>
        )
      ) : null}
      {sale && !isFinalStatus(sale.status) ? (
        <WaitingSale
          sale={sale}
          cancelling={screen.cancelling}
          cancelError={screen.cancelFailure ? failureText(screen.cancelFailure) : ''}
          onCancel={screen.onCancel}
        />
      ) : null}
      {sale && isFinalStatus(sale.status) ? (
        <SaleResult sale={sale} paidAt={screen.paidAt} onNewSale={screen.newSale} />
      ) : null}
    </section>
  );
}
