import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import type { GatewayMode } from '../../shared/types';

export function GatewayModeConfirm({
  pendingMode,
  loading,
  error,
  onConfirm,
  onCancel,
}: {
  pendingMode: GatewayMode;
  loading: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation('demo');

  return (
    <div className="grid gap-3" role="group" aria-label={t('paymentMode')}>
      <p>{pendingMode === 'mpesa' ? t('confirmLive') : t('confirmSimulated')}</p>
      {error ? (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
      <Button loading={loading} onClick={onConfirm}>
        {t('switchYes')}
      </Button>
      <Button variant="secondary" disabled={loading} onClick={onCancel}>
        {t('cancel')}
      </Button>
    </div>
  );
}
