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
    <header className="sticky top-0 z-30 border-b border-line bg-surface px-3 pt-[env(safe-area-inset-top)]">
      <div className="flex min-h-nav items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{host.getBusinessName()}</p>
        <button
          type="button"
          className="inline-flex min-h-12 w-28 shrink-0 items-center justify-center rounded-control px-3 text-sm font-semibold"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          {t('menu')}
        </button>
      </div>
      <Sheet open={open} title={t('menu')} onClose={() => setOpen(false)}>
        <div className="grid gap-4">
          <LanguageToggle />
          <Link
            to="/reports"
            className="inline-flex min-h-control items-center justify-center rounded-control border border-line px-4 font-semibold"
            onClick={() => setOpen(false)}
          >
            {t('reports')}
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
