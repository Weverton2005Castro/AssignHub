import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };

import { ThemeToggle } from '@/components/theme-toggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      {children}
    </>
  );
}
