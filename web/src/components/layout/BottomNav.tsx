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
    <nav className="fixed bottom-[calc(12px+env(safe-area-inset-bottom))] left-1/2 z-30 flex h-16 w-[calc(100%-2rem)] max-w-[388px] -translate-x-1/2 items-center justify-around rounded-full bg-ink px-2 shadow-shell">
      <ul className="grid h-full w-full grid-cols-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <li key={tab.to} className="flex">
              <NavLink
                to={tab.to}
                className="flex flex-1 items-center justify-center text-white/75"
              >
                {({ isActive }) => (
                  <span
                    className={`flex h-12 min-w-12 items-center justify-center gap-2 rounded-full px-3 ${isActive ? 'bg-primary text-primary-foreground shadow-[0_0_0_6px_rgba(0,107,60,0.28)]' : ''}`}
                  >
                    <Icon />
                    <span className={isActive ? 'text-sm font-semibold' : 'sr-only'}>
                      {t(tab.labelKey)}
                    </span>
                  </span>
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
