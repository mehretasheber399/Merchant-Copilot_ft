import { useTranslation } from 'react-i18next';
import { config } from '../../config';
import type { SaleRequestView } from '../../shared/types';
import { useLocaleStore } from '../../store/locale';
import { formatMoney } from '../../utils/format';
import { Button } from '../../components/ui/Button';
import { useCountdown } from './useCountdown';

export function WaitingSale({
  sale,
  cancelling,
  cancelError,
  onCancel,
}: {
  sale: SaleRequestView;
  cancelling: boolean;
  cancelError: string;
  onCancel: () => void;
}) {
  const { t } = useTranslation('sale');
  const locale = useLocaleStore((state) => state.locale);
  const seconds = useCountdown(sale.requestId, sale.secondsLeft);

  return (
    <section aria-live="polite" className="grid gap-4">
      <h1 className="text-2xl font-semibold">{t('waiting')}</h1>
      <p className="text-2xl font-semibold">{formatMoney(sale.amount, locale)}</p>
      <p>{sale.phoneMasked}</p>
      <p role="status">{t('secondsLeft', { count: seconds })}</p>
      {sale.warnings.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold">{t('warnings')}</h2>
          <ul className="mt-1 grid gap-1">
            {sale.warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {cancelError ? (
        <p role="alert" className="text-sm font-semibold text-danger">
          {cancelError}
        </p>
      ) : null}
      <Button variant="secondary" loading={cancelling} onClick={onCancel}>
        {t('cancelPayment')}
      </Button>
      {config.demoTools ? (
        <a
          className="inline-flex min-h-control items-center justify-center rounded-control border border-line px-4 font-semibold"
          href={`/customer-sim?requestId=${encodeURIComponent(sale.requestId)}`}
          target="_blank"
          rel="noreferrer"
        >
          {t('openPhone')}
        </a>
      ) : null}
    </section>
  );
}
