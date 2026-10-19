import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import type { SaleRequestView } from '../../shared/types';
import { useLocaleStore } from '../../store/locale';
import { formatMoney, formatTime } from '../../utils/format';
import { showLatePayment } from './logic';

function itemCount(sale: SaleRequestView): number {
  return sale.items.reduce((sum, item) => sum + item.qty, 0);
}

export function SaleResult({
  sale,
  paidAt,
  onNewSale,
}: {
  sale: SaleRequestView;
  paidAt: string | null;
  onNewSale: () => void;
}) {
  const { t } = useTranslation('sale');
  const locale = useLocaleStore((state) => state.locale);
  const late = showLatePayment(sale.status, sale.lateConfirmation);
  const receiptId = `#${sale.requestId.slice(0, 4)}`;
  const count = itemCount(sale);

  const shareReceipt = () => {
    const lines = [
      t('transactionDetails'),
      `${t('receiptNo')} ${receiptId}`,
      formatMoney(sale.amount, locale),
      `${t('customer')}: ${sale.phoneMasked}`,
      `${t('itemsLabel')}: ${t('itemCount', { count })}`,
      ...(paidAt ? [`${t('paidAt')}: ${formatTime(paidAt, locale)}`] : []),
      `${t('paymentMethod')}: ${t('mpesa')}`,
      ...sale.items.map((item) => `${item.name} × ${item.qty}`),
    ];
    const text = lines.join('\n');
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      void navigator.share({ title: t('receipt'), text }).catch(() => undefined);
      return;
    }
    void navigator.clipboard?.writeText(text);
  };

  if (sale.status === 'PAID') {
    return (
      <section aria-live="polite" className="grid gap-4">
        {late ? <p className="font-semibold text-warning">{t('late')}</p> : null}
        <div className="overflow-hidden rounded-[20px] border border-line bg-surface shadow-shell">
          <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
            <div className="min-w-0">
              <h1 className="text-lg font-bold">{t('transactionDetails')}</h1>
              <p className="mt-0.5 text-sm text-muted">{receiptId}</p>
            </div>
          </div>
          <div className="grid place-items-center gap-2 px-4 pb-2 pt-6 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 12 5 5L20 7" />
              </svg>
            </span>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">{t('paid')}</p>
            <p className="text-3xl font-extrabold tabular-nums">
              {formatMoney(sale.amount, locale)}
            </p>
          </div>
          <dl className="mx-4 mb-4 grid gap-3 border-t border-line pt-4">
            <div className="flex justify-between gap-3 text-sm">
              <dt className="text-muted">{t('customer')}</dt>
              <dd className="font-bold">{sale.phoneMasked}</dd>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <dt className="text-muted">{t('itemsLabel')}</dt>
              <dd className="font-bold">{t('itemCount', { count })}</dd>
            </div>
            {paidAt ? (
              <div className="flex justify-between gap-3 text-sm">
                <dt className="text-muted">{t('paidAt')}</dt>
                <dd className="font-bold">{formatTime(paidAt, locale)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3 text-sm">
              <dt className="text-muted">{t('paymentMethod')}</dt>
              <dd className="font-bold">{t('mpesa')}</dd>
            </div>
          </dl>
          {sale.items.length > 0 ? (
            <ul className="mx-4 mb-4 grid gap-2 border-t border-line pt-3">
              {sale.items.map((item) => (
                <li
                  key={`${item.productId}-${item.name}`}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 truncate font-semibold">
                    {item.name} × {item.qty}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted">
                    {formatMoney(item.price * item.qty, locale)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="border-t border-line p-4">
            <button
              type="button"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-primary bg-surface text-base font-bold text-primary"
              onClick={shareReceipt}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
                <path d="M9 8h6M9 12h6" />
              </svg>
              {t('shareReceipt')}
            </button>
          </div>
        </div>
        <Button onClick={onNewSale}>{t('newSale')}</Button>
      </section>
    );
  }

  return (
    <section aria-live="polite" className="grid gap-4">
      {sale.status === 'DECLINED' ? (
        <h1 className="text-2xl font-semibold">{t('wrongPin')}</h1>
      ) : null}
      {sale.status === 'INSUFFICIENT' ? (
        <h1 className="text-2xl font-semibold">{t('insufficient')}</h1>
      ) : null}
      {sale.status === 'TIMEOUT' ? (
        <h1 className="text-2xl font-semibold">{t('timeout')}</h1>
      ) : null}
      {sale.status === 'CANCELLED' ? (
        <h1 className="text-2xl font-semibold">{t('cancelled')}</h1>
      ) : null}
      <Button onClick={onNewSale}>{t('newSale')}</Button>
    </section>
  );
}
