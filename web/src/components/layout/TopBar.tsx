import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { config } from '../../config';
import { DemoPanel } from '../../features/demo/DemoPanel';
import { useHost } from '../../host/host';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';
import { LanguageToggle } from './LanguageToggle';

export function TopBar() {
  const { t } = useTranslation('common');
  const host = useHost();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 rounded-b-[28px] bg-primary px-4 pb-5 pt-[max(0.75rem,env(safe-area-inset-top))] text-primary-foreground shadow-shell">
      <div className="flex min-h-14 items-center gap-3">
        <span
          aria-hidden="true"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/20 text-sm font-extrabold"
        >
          {(host.getBusinessName().trim()[0] ?? 'M').toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70">
            {t('appName')}
          </p>
          <p className="truncate text-base font-bold">{host.getBusinessName()}</p>
        </div>
        <button
          type="button"
          className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/15 px-4 text-sm font-semibold text-white"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          {t('menu')}
        </button>
      </div>
      <Sheet open={open} title={t('menu')} preferField={false} onClose={() => setOpen(false)}>
        <div className="grid gap-3">
          <section className="rounded-card border border-line bg-surface p-4">
            <p className="mb-3 text-sm font-semibold text-muted">{t('language')}</p>
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
                strokeWidth="2"
              >
                <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="min-w-0 flex-1 font-bold">{t('reports')}</span>
          </Link>
          {config.demoTools ? <DemoPanel onClose={() => setOpen(false)} /> : null}
          <Button variant="secondary" onClick={() => host.logout()}>
            {t('logout')}
          </Button>
        </div>
      </Sheet>
    </header>
  );
}
