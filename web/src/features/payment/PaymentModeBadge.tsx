import { useTranslation } from 'react-i18next';
import type { GatewayMode } from '../../shared/types';

export function PaymentModeBadge({
  mode,
  compact = false,
}: {
  mode: GatewayMode | undefined;
  compact?: boolean;
}) {
  const { t } = useTranslation('payment');

  if (mode !== 'mock' && mode !== 'mpesa') {
    return null;
  }

  const live = mode === 'mpesa';
  const label = live ? t('live') : t('simulated');

  return (
    <span
      role="status"
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold tracking-wide ${
        live
          ? 'border-success/30 bg-success-soft text-success'
          : 'border-warning/30 bg-warning-soft text-warning'
      } ${compact ? 'min-h-8' : 'min-h-9'}`}
    >
      {live ? (
        <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-success" />
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5 shrink-0"
          fill="currentColor"
        >
          <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM7.25 4h1.5v5h-1.5V4Zm0 6.5h1.5V12h-1.5v-1.5Z" />
        </svg>
      )}
      <span className="truncate">{label}</span>
    </span>
  );
}
