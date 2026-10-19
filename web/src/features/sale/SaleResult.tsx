import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import type { SaleRequestView } from '../../shared/types';
import { useLocaleStore } from '../../store/locale';
import { formatMoney, formatTime } from '../../utils/format';
import { showLatePayment } from './logic';

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

  return (
    <section aria-live="polite" className="grid gap-4">
      {sale.status === 'PAID' ? (
        <>
          <h1 className="text-2xl font-semibold">{t('receipt')}</h1>
          {late ? <p className="font-semibold text-warning">{t('late')}</p> : null}
          <ul className="grid gap-2 rounded-card border border-line bg-surface p-4">
            {sale.items.map((item) => (
              <li key={`${item.productId}-${item.name}`} className="flex justify-between gap-3">
                <span>
                  {item.name} × {item.qty}
                </span>
                <span className="font-semibold">{formatMoney(item.price * item.qty, locale)}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-[15px] bg-primary px-4 py-5 text-center text-primary-foreground">
            <p className="text-xs text-[#B9DDC9]">{t('receipt')}</p>
            <p className="mt-2 text-[28px] font-bold">{formatMoney(sale.amount, locale)}</p>
          </div>
          {paidAt ? <p>{formatTime(paidAt, locale)}</p> : null}
        </>
      ) : null}
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
