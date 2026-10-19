import { useEffect, useId, useRef, type ReactNode, type TouchEvent } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Sheet({
  open,
  title,
  onClose,
  swipeClose = false,
  preferField = true,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  swipeClose?: boolean;
  preferField?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation('common');
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const dragY = useRef<number | null>(null);
  const titleId = useId();
  onCloseRef.current = onClose;

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!swipeClose) {
      return;
    }
    dragY.current = event.touches[0]?.clientY ?? null;
  };

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (!swipeClose || dragY.current === null) {
      return;
    }
    const end = event.changedTouches[0]?.clientY;
    const start = dragY.current;
    dragY.current = null;
    if (end !== undefined && end - start >= 48) {
      onCloseRef.current();
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const firstInput = panel?.querySelector<HTMLElement>('input, select, textarea');
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    const target = preferField ? (firstInput ?? first) : first;
    target?.focus(preferField ? undefined : { preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panel) {
        return;
      }
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (!firstItem || !lastItem) {
        return;
      }
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, preferField]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0"
        aria-label={t('close')}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[92dvh] w-full max-w-[420px] overflow-y-auto rounded-t-[23px] bg-surface px-[18px] pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 shadow-shell"
      >
        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-line" aria-hidden="true" />
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-line pb-3">
            <h2 id={titleId} className="text-lg font-bold tracking-tight">
              {title}
            </h2>
            <button
              type="button"
              className="grid h-12 w-12 place-items-center rounded-[10px] bg-canvas text-muted"
              aria-label={t('close')}
              onClick={onClose}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
