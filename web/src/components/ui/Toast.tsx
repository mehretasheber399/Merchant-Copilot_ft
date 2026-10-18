import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useToastStore } from '../../store/toast';
import type { ToastTone } from '../../shared/types';

const tones: Record<ToastTone, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-primary-soft text-primary',
};

export function ToastViewport() {
  const { t } = useTranslation('common');
  const { pathname } = useLocation();
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);
  const aboveNav =
    pathname === '/sale' ||
    pathname === '/items' ||
    pathname === '/dashboard' ||
    pathname === '/insights';

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 z-40 flex justify-center px-3 ${aboveNav ? 'bottom-[calc(56px+env(safe-area-inset-bottom)+12px)]' : 'bottom-[max(0.75rem,env(safe-area-inset-bottom))]'}`}
    >
      <div className="flex w-full max-w-[420px] flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'danger' ? 'alert' : 'status'}
            className={`pointer-events-auto flex min-h-control items-center gap-2 rounded-card px-3 shadow-card ${tones[toast.tone]}`}
          >
            <p className="min-w-0 flex-1 text-sm font-semibold">{toast.message}</p>
            <button
              type="button"
              className="inline-flex h-12 shrink-0 items-center px-3 text-sm font-semibold"
              onClick={() => dismiss(toast.id)}
            >
              {t('close')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
