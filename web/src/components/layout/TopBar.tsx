import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useHost } from '../../host/host';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';
import { LanguageToggle } from './LanguageToggle';

const pages: Record<string, { title: string; subtitle: string }> = {
  '/sale': { title: 'sale:title', subtitle: 'sale:request' },
  '/items': { title: 'items:title', subtitle: 'items:search' },
  '/insights': { title: 'insights:title', subtitle: 'insights:briefingTitle' },
  '/reports': { title: 'reports:title', subtitle: 'reports:collections' },
};

export function TopBar() {
  const { t } = useTranslation(['common', 'sale', 'items', 'insights', 'reports']);
  const host = useHost();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const page = pages[pathname];
  const business = host.getBusinessName();
  const mark = (business.trim()[0] ?? 'S').toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 px-4 pt-[max(0.25rem,env(safe-area-inset-top))] backdrop-blur-md">
      <div className="flex h-[68px] items-center justify-between gap-3">
        {page ? (
          <div className="min-w-0">
            <p className="truncate text-lg font-bold leading-none">{t(page.title)}</p>
            <p className="mt-1 truncate text-xs text-muted">{t(page.subtitle)}</p>
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="grid h-9 w-9 shrink-0 -rotate-6 place-items-center rounded-[11px] bg-primary text-lg font-extrabold text-white shadow-shell"
            >
              {mark}
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-bold leading-none">{t('common:appName')}</p>
              <p className="mt-1 truncate text-xs text-muted">{business}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          className="inline-flex h-12 shrink-0 items-center rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink"
          onClick={() => host.logout()}
        >
          {t('common:logout')}
        </button>
        <button
          type="button"
          className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-line bg-white text-muted"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={t('common:menu')}
          onClick={() => setOpen(true)}
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
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
            <path d="M10 21h4" />
          </svg>
          <span
            aria-hidden="true"
            className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full border border-white bg-[#EE6D54]"
          />
        </button>
      </div>
      <Sheet
        open={open}
        title={t('common:menu')}
        preferField={false}
        onClose={() => setOpen(false)}
      >
        <div className="grid gap-3">
          <section className="rounded-card border border-line bg-surface p-4">
            <p className="mb-3 text-sm font-semibold text-muted">{t('common:language')}</p>
            <LanguageToggle wide />
          </section>
          <Link
            to="/reports"
            className="flex min-h-[4.5rem] items-center gap-3 rounded-card border border-line bg-surface px-3"
            onClick={() => setOpen(false)}
          >
            <span
              aria-hidden="true"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 3h9l4 4v14H6z" />
                <path d="M14 3v5h5M9 13h6M9 17h6" />
              </svg>
            </span>
            <span className="min-w-0 flex-1 font-bold">{t('common:reports')}</span>
          </Link>
          <Button variant="secondary" onClick={() => host.logout()}>
            {t('common:logout')}
          </Button>
        </div>
      </Sheet>
    </header>
  );
}
