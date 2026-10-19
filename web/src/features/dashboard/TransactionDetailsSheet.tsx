import { useTranslation } from 'react-i18next';
import { Sheet } from '../../components/ui/Sheet';
import type { Locale } from '../../shared/types';
import { formatMoney } from '../../utils/format';

export interface TransactionDetails {
  id: string;
  amount: number;
  customer: string;
  itemCount: number;
  timeLabel: string;
}

export function TransactionDetailsSheet({
  open,
  details,
  locale,
  onClose,
}: {
  open: boolean;
  details: TransactionDetails | null;
  locale: Locale;
  onClose: () => void;
}) {
  const { t } = useTranslation(['sale', 'common']);
  if (!details) {
    return null;
  }

  const receiptId = `#${details.id.replace(/\W/g, '').slice(-4) || details.id.slice(0, 4)}`;
  const amountLabel = formatMoney(details.amount, locale);
  const itemsLabel = t('sale:receiptItemCount', { count: details.itemCount });

  const shareReceipt = () => {
    const text = [
      t('sale:transactionDetails'),
      receiptId,
      amountLabel,
      `${t('sale:customer')}: ${details.customer}`,
      `${t('sale:itemsLabel')}: ${itemsLabel}`,
      `${t('sale:paidAt')}: ${details.timeLabel}`,
      `${t('sale:paymentMethod')}: ${t('sale:mpesa')}`,
    ].join('\n');
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      void navigator.share({ title: t('sale:receipt'), text }).catch(() => undefined);
      return;
    }
    void navigator.clipboard?.writeText(text);
  };

  return (
    <Sheet
      open={open}
      title={t('sale:transactionDetails')}
      subtitle={receiptId}
      onClose={onClose}
      preferField={false}
      swipeClose
    >
      <div className="grid place-items-center gap-1.5 pb-1 pt-5 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m5 12 5 5L20 7" />
          </svg>
        </span>
        <p className="text-sm font-semibold text-primary">{t('sale:paid')}</p>
        <p className="mt-1 text-[32px] font-extrabold leading-none tracking-tight tabular-nums text-ink">
          {amountLabel}
        </p>
      </div>

      <dl className="mt-7 border-t border-line">
        <div className="flex items-center justify-between gap-3 border-b border-line py-3.5 text-sm">
          <dt className="text-muted">{t('sale:customer')}</dt>
          <dd className="font-bold text-ink">{details.customer || '—'}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-line py-3.5 text-sm">
          <dt className="text-muted">{t('sale:itemsLabel')}</dt>
          <dd className="font-bold text-ink">{itemsLabel}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-line py-3.5 text-sm">
          <dt className="text-muted">{t('sale:paidAt')}</dt>
          <dd className="font-bold text-ink">{details.timeLabel || '—'}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-line py-3.5 text-sm">
          <dt className="text-muted">{t('sale:paymentMethod')}</dt>
          <dd className="font-bold text-ink">{t('sale:mpesa')}</dd>
        </div>
      </dl>

      <button
        type="button"
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface text-base font-bold text-primary"
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
        {t('sale:shareReceipt')}
      </button>
    </Sheet>
  );
}
