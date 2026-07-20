'use client';

import { Menu, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUiStore } from '@/stores/ui-store';

export function TopbarFixed() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Alternar menu">
        <Menu className="h-4 w-4" />
      </Button>
      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar assinaturas..."
          onFocus={() => setCommandOpen(true)}
          readOnly
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Link href="/ai">
          <Button variant="outline" size="sm">
            Copiloto
          </Button>
        </Link>
        <Link href="/profile">
          <Button variant="ghost" size="sm">
            Perfil
          </Button>
        </Link>
      </div>
    </header>
  );
}
