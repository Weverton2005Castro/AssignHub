'use client';

import {
  Bell,
  Calendar,
  CreditCard,
  Flag,
  LayoutDashboard,
  Link2,
  MessageSquare,
  PieChart,
  Radar,
  Settings,
  Tags,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/subscriptions', label: 'Assinaturas', icon: CreditCard },
  { href: '/calendar', label: 'Calendário', icon: Calendar },
  { href: '/charges', label: 'Cobranças', icon: Wallet },
  { href: '/detection', label: 'Detecções', icon: Radar },
  { href: '/categories', label: 'Categorias', icon: Tags },
  { href: '/ai', label: 'Copiloto', icon: MessageSquare },
  { href: '/reports', label: 'Relatórios', icon: PieChart },
  { href: '/goals', label: 'Metas', icon: Flag },
  { href: '/integrations', label: 'Integrações', icon: Link2 },
  { href: '/notifications', label: 'Notificações', icon: Bell },
  { href: '/settings', label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);

  return (
    <aside
      className={cn(
        'hidden h-screen shrink-0 border-r bg-background md:flex md:flex-col',
        collapsed ? 'w-[64px]' : 'w-[240px]',
      )}
    >
      <div className={cn('flex h-14 items-center border-b px-4', collapsed && 'justify-center px-2')}>
        <Link href="/dashboard" className="font-semibold tracking-tight">
          {collapsed ? 'SH' : 'SubscriptionHub'}
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-secondary font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                collapsed && 'justify-center px-2',
              )}
              title={item.label}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
