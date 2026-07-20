'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { setStoredTokens } from '@/lib/api';

const links = [
  { href: '/profile', title: 'Perfil', desc: 'Nome, e-mail, locale e moeda' },
  { href: '/integrations', title: 'Contas conectadas', desc: 'Open Finance, Gmail e lojas' },
  { href: '/notifications', title: 'Preferências de alerta', desc: 'Canais e tipos de notificação' },
  { href: '/settings/audit', title: 'Auditoria', desc: 'Seus logs de acesso e ações' },
  { href: '/settings/danger', title: 'Privacidade e conta', desc: 'Exportar dados ou excluir conta' },
];

export default function SettingsPage() {
  const router = useRouter();

  function logout() {
    setStoredTokens(null);
    router.push('/login');
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Configurações" description="Conta, privacidade e segurança." />
      <div className="space-y-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="mb-3 transition-colors hover:bg-muted/30">
              <CardHeader className="py-4">
                <CardTitle className="text-base">{l.title}</CardTitle>
                <CardDescription>{l.desc}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <p className="text-sm">Sessão</p>
            <Button variant="outline" onClick={logout}>
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
