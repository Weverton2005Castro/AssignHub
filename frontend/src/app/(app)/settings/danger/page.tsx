'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, setStoredTokens } from '@/lib/api';

export default function DangerPage() {
  const router = useRouter();
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  const exportData = useMutation({
    mutationFn: () => api.post('/api/v1/me/export'),
    onSuccess: () => setExportMsg('Exportação gerada. Em produção enviaremos um link seguro por e-mail.'),
  });

  const deleteAccount = useMutation({
    mutationFn: () => api.delete('/api/v1/me'),
    onSuccess: () => {
      setStoredTokens(null);
      router.push('/');
    },
  });

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Privacidade e conta"
        description="Portabilidade e exclusão conforme LGPD."
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Exportar meus dados</CardTitle>
          <CardDescription>
            Baixe um pacote com assinaturas, cobranças e consentimentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => exportData.mutate()} disabled={exportData.isPending}>
            Solicitar exportação
          </Button>
          {exportMsg ? <p className="mt-3 text-sm text-muted-foreground">{exportMsg}</p> : null}
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Excluir conta</CardTitle>
          <CardDescription>
            Soft-delete imediato e exclusão definitiva assíncrona. Esta ação encerra o acesso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm('Confirma a exclusão da conta?')) deleteAccount.mutate();
            }}
            disabled={deleteAccount.isPending}
          >
            Excluir permanentemente
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
