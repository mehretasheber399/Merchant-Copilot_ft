import { useTranslation } from 'react-i18next';
import { useHost } from '../../host/host';
import { LanguageToggle } from './LanguageToggle';

export function TopBar() {
  const { t } = useTranslation('common');
  const host = useHost();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface px-3 pt-[env(safe-area-inset-top)]">
      <div className="flex min-h-nav items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{host.getBusinessName()}</p>
        <LanguageToggle />
        <button
          type="button"
          className="inline-flex min-h-12 shrink-0 items-center rounded-control px-3 text-sm font-semibold"
          onClick={() => host.logout()}
        >
          {t('logout')}
        </button>
      </div>
    </header>
  );
}
