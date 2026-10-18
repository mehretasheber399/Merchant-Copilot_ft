import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/sale', labelKey: 'sale', icon: SaleIcon },
  { to: '/items', labelKey: 'items', icon: ItemsIcon },
  { to: '/dashboard', labelKey: 'dashboard', icon: DashboardIcon },
  { to: '/insights', labelKey: 'insights', icon: InsightsIcon },
] as const;

export function BottomNav() {
  const { t } = useTranslation('nav');

  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[420px] -translate-x-1/2 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      <ul className="grid h-nav grid-cols-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                className={({ isActive }) =>
                  `flex h-nav flex-col items-center justify-center gap-0.5 px-1 text-center text-xs font-semibold leading-tight ${isActive ? 'bg-primary-soft text-primary' : 'text-muted'}`
                }
              >
                <Icon />
                <span>{t(tab.labelKey)}</span>
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
      strokeWidth="2"
    >
      {children}
    </svg>
  );
}

function SaleIcon() {
  return (
    <IconFrame>
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6 5 3H2" />
    </IconFrame>
  );
}

function ItemsIcon() {
  return (
    <IconFrame>
      <path d="M4 7h16v12H4z" />
      <path d="M8 7V5h8v2" />
    </IconFrame>
  );
}

function DashboardIcon() {
  return (
    <IconFrame>
      <path d="M4 13h7V4H4zM13 20h7V4h-7zM4 20h7v-5H4z" />
    </IconFrame>
  );
}

function InsightsIcon() {
  return (
    <IconFrame>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
      <circle cx="12" cy="12" r="3" />
    </IconFrame>
  );
}
