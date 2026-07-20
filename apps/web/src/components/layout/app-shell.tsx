'use client';

import { Sidebar } from './sidebar';
import { TopbarFixed } from './topbar';
import { MobileNav } from './mobile-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopbarFixed />
        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
