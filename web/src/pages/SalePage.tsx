import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import i18n from '../i18n';
import type { SaleFailure } from '../features/sale/errors';
import { cartTotal, isFinalStatus } from '../features/sale/logic';
import { SaleCatalog } from '../features/sale/SaleCatalog';
import { SaleCheckout } from '../features/sale/SaleCheckout';
import { SaleHero } from '../features/sale/SaleHero';
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
  const screen = useSaleScreen();
  const [step, setStep] = useState<'cart' | 'pay' | null>(null);
  const total = cartTotal(screen.lines);
  const sale = screen.sale;
  const showSale = Boolean(screen.requestId);

  useEffect(() => {
    if (screen.lines.length === 0) {
      setStep(null);
    }
  }, [screen.lines.length]);

  return (
    <section className={screen.lines.length > 0 && !showSale ? 'pb-24' : undefined}>
      {!showSale ? (
        <>
          <h1 className="sr-only">{t('title')}</h1>
          <SaleHero />
        </>
      ) : null}
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
          <SaleCheckout
            step={step}
            products={screen.products.data ?? []}
            lines={screen.lines}
            total={total}
            phone={screen.phone}
            phoneError={screen.phoneError ? t('phoneInvalid') : undefined}
            limitReached={screen.limitReached ? t('lineLimit') : undefined}
            failure={screen.failure ? failureText(screen.failure) : undefined}
            requesting={screen.requesting}
            onClose={() => setStep(null)}
            onBack={() => setStep('cart')}
            onContinue={() => setStep('pay')}
            onChange={screen.change}
            onPhone={screen.setPhone}
            onPhoneBlur={screen.blurPhone}
            onSubmit={screen.submit}
          />
          {screen.lines.length > 0 ? (
            <button
              type="button"
              aria-label={t('viewCart')}
              className="fixed bottom-[calc(84px+env(safe-area-inset-bottom))] left-1/2 z-20 flex h-[58px] w-[calc(100%-2rem)] max-w-[388px] -translate-x-1/2 items-center gap-3 rounded-[15px] bg-[#173D2C] px-4 text-left text-primary-foreground shadow-[0_12px_30px_rgba(22,60,43,0.27)]"
              onClick={() => setStep('cart')}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#2D644C] text-sm font-bold">
                {screen.lines.reduce((sum, line) => sum + line.qty, 0)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] text-[#ACD1BE]">{t('currentSale')}</span>
                <span className="block text-sm font-bold">{t('viewCart')}</span>
              </span>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M14 7l5 5-5 5" />
              </svg>
            </button>
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
