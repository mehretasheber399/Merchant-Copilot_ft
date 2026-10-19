import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';

export function AppShell() {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#EEF2EF]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col overflow-x-hidden bg-canvas shadow-[0_0_45px_rgba(27,49,37,0.08)]">
        <TopBar />
        <main className="min-w-0 flex-1 overflow-x-hidden bg-canvas px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-5">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
