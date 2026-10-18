import { Outlet } from 'react-router-dom';
import { InstallHint } from '../ui/InstallHint';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';

export function AppShell() {
  return (
    <div className="min-h-dvh overflow-x-hidden">
      <div className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col overflow-x-hidden bg-canvas">
        <TopBar />
        <main className="min-w-0 flex-1 overflow-x-hidden bg-canvas px-4 pb-[calc(108px+env(safe-area-inset-bottom))] pt-5">
          <InstallHint />
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
