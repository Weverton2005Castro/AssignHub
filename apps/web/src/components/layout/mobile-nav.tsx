'use client';

import { Calendar, CreditCard, LayoutDashboard, Menu, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const items = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/subscriptions', label: 'Assinaturas', icon: CreditCard },
  { href: '/calendar', label: 'Calendário', icon: Calendar },
  { href: '/ai', label: 'IA', icon: MessageSquare },
  { href: '/settings', label: 'Mais', icon: Menu },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-background md:hidden">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-[10px]',
              active ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
