import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { NoticeSheet } from '../../features/notices/NoticeSheet';
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
  const [menu, setMenu] = useState(false);
  const [notes, setNotes] = useState(false);
  const page = pages[pathname];
  const business = host.getBusinessName();
  const mark = (business.trim()[0] ?? 'S').toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 px-4 pt-[max(0.25rem,env(safe-area-inset-top))] backdrop-blur-md">
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
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-xl border border-line bg-white text-muted"
            aria-haspopup="dialog"
            aria-expanded={notes}
            aria-label={t('common:notifications')}
            onClick={() => setNotes(true)}
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
          </button>
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-xl border border-line bg-white text-ink"
            aria-haspopup="dialog"
            aria-expanded={menu}
            aria-label={t('common:menu')}
            onClick={() => setMenu(true)}
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
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>
      <Sheet
        open={menu}
        title={t('common:menu')}
        preferField={false}
        placement="top"
        onClose={() => setMenu(false)}
      >
        <div className="grid gap-3">
          <section className="rounded-card border border-line bg-surface p-4">
            <p className="mb-3 text-sm font-semibold text-muted">{t('common:language')}</p>
            <LanguageToggle wide />
          </section>
          <Button
            variant="secondary"
            onClick={() => {
              setMenu(false);
              host.logout();
            }}
          >
            {t('common:logout')}
          </Button>
        </div>
      </Sheet>
      <NoticeSheet open={notes} onClose={() => setNotes(false)} />
    </header>
  );
}
