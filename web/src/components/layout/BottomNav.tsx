import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/dashboard', labelKey: 'dashboard', ns: 'nav', icon: DashboardIcon },
  { to: '/sale', labelKey: 'sale', ns: 'nav', icon: SaleIcon },
  { to: '/items', labelKey: 'items', ns: 'nav', icon: ItemsIcon },
  { to: '/insights', labelKey: 'insights', ns: 'nav', icon: InsightsIcon },
  { to: '/reports', labelKey: 'reports', ns: 'common', icon: ReportsIcon },
] as const;

export function BottomNav() {
  const { t } = useTranslation(['nav', 'common']);

  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[420px] -translate-x-1/2 border-t border-line bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <ul className="grid h-[72px] grid-cols-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <li key={tab.to} className="flex">
              <NavLink
                to={tab.to}
                className="flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-muted"
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-[10px] ${isActive ? 'bg-primary-soft text-primary' : ''}`}
                    >
                      <Icon />
                    </span>
                    <span className={isActive ? 'text-primary' : undefined}>
                      {t(`${tab.ns}:${tab.labelKey}`)}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function IconFrame({ children }: { children: ReactNode }) {
  return (
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
      {children}
    </svg>
  );
}

function SaleIcon() {
  return (
    <IconFrame>
      <path d="M4 7h16l-1.5 12h-13L4 7Z" />
      <path d="M8 10V6a4 4 0 0 1 8 0v4" />
    </IconFrame>
  );
}

function ItemsIcon() {
  return (
    <IconFrame>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z" />
      <path d="m4.3 7.7 7.7 4.4 7.7-4.4M12 21v-9" />
    </IconFrame>
  );
}

function DashboardIcon() {
  return (
    <IconFrame>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9M9 20v-6h6v6" />
    </IconFrame>
  );
}

function InsightsIcon() {
  return (
    <IconFrame>
      <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
    </IconFrame>
  );
}

function ReportsIcon() {
  return (
    <IconFrame>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </IconFrame>
  );
}
