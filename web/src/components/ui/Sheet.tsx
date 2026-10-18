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
        className="relative z-10 max-h-[92dvh] w-full max-w-[420px] overflow-y-auto rounded-t-[1.75rem] bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-shell"
      >
        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {swipeClose ? (
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line" aria-hidden="true" />
          ) : null}
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id={titleId} className="text-xl font-extrabold tracking-tight">
              {title}
            </h2>
            <button
              type="button"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-canvas px-4 text-sm font-bold text-muted"
              onClick={onClose}
            >
              {t('close')}
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
