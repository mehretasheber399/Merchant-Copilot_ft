import { Outlet } from 'react-router-dom';
import { InstallHint } from '../ui/InstallHint';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';

export function AppShell() {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-canvas">
      <div className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col overflow-x-hidden bg-surface shadow-shell">
        <TopBar />
        <main className="min-w-0 flex-1 overflow-x-hidden px-4 pb-[calc(56px+env(safe-area-inset-bottom)+16px)] pt-4">
          <InstallHint />
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
