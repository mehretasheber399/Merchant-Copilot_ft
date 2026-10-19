import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import {
  TransactionDetailsSheet,
  type TransactionDetails,
} from '../dashboard/TransactionDetailsSheet';
import type { SaleRequestView } from '../../shared/types';
import { useLocaleStore } from '../../store/locale';
import { formatClock, formatMoney } from '../../utils/format';
import { showLatePayment } from './logic';

function toDetails(
  sale: SaleRequestView,
  paidAt: string | null,
  locale: 'en' | 'am',
): TransactionDetails {
  return {
    id: sale.requestId,
    amount: sale.amount,
    customer: sale.phoneMasked,
    itemCount: sale.items.reduce((sum, item) => sum + item.qty, 0),
    timeLabel: paidAt ? formatClock(paidAt, locale) : '',
  };
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
  const [open, setOpen] = useState(sale.status === 'PAID');

  useEffect(() => {
    if (sale.status === 'PAID') {
      setOpen(true);
    }
  }, [sale.requestId, sale.status]);

  if (sale.status === 'PAID') {
    return (
      <section aria-live="polite" className="grid gap-4">
        {late ? <p className="font-semibold text-warning">{t('late')}</p> : null}
        <div className="grid place-items-center gap-2 rounded-[18px] border border-line bg-surface px-4 py-8 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m5 12 5 5L20 7" />
            </svg>
          </span>
          <p className="text-sm font-semibold text-primary">{t('paid')}</p>
          <p className="text-[28px] font-extrabold leading-none tabular-nums">
            {formatMoney(sale.amount, locale)}
          </p>
          <button
            type="button"
            className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-line bg-surface text-base font-bold text-primary"
            onClick={() => setOpen(true)}
          >
            {t('transactionDetails')}
          </button>
        </div>
        <TransactionDetailsSheet
          open={open}
          details={toDetails(sale, paidAt, locale)}
          locale={locale}
          onClose={() => setOpen(false)}
        />
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
