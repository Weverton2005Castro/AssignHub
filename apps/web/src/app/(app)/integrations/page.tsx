'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

type IntegrationItem = {
  type: string;
  status: string;
  connected: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
  configured?: boolean;
  requiresGmail?: boolean;
  gmailReady?: boolean;
  mode?: string;
};

type Integrations = { data: IntegrationItem[] };

const labels: Record<string, { title: string; desc: string }> = {
  OPEN_FINANCE: {
    title: 'Open Finance',
    desc: 'Transações reais do banco via Pluggy (Open Finance Brasil).',
  },
  GMAIL: {
    title: 'Gmail',
    desc: 'OAuth Google + Gmail API: invoices e receipts reais da caixa de entrada.',
  },
  GOOGLE_PLAY: {
    title: 'Google Play',
    desc: 'Recibos reais do Google Play/Google One via Gmail conectado.',
  },
  APPLE: {
    title: 'Apple',
    desc: 'Recibos reais App Store / iCloud via Gmail conectado.',
  },
  AMAZON: {
    title: 'Amazon',
    desc: 'Recibos reais Amazon/Prime via Gmail conectado.',
  },
  MICROSOFT: {
    title: 'Microsoft',
    desc: 'Microsoft Graph ou recibos via Gmail — dados reais da conta.',
  },
};

declare global {
  interface Window {
    PluggyConnect?: new (opts: {
      connectToken: string;
      onSuccess: (data: { item: { id: string } }) => void;
      onError: (error: { message?: string }) => void;
      onClose?: () => void;
    }) => { init: () => void };
  }
}

function loadPluggyScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.PluggyConnect) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[data-pluggy]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://cdn.pluggy.ai/pluggy-connect/v2.8.2/pluggy-connect.js';
    s.async = true;
    s.dataset.pluggy = '1';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Falha ao carregar Pluggy Connect'));
    document.body.appendChild(s);
  });
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-48" />}>
      <IntegrationsContent />
    </Suspense>
  );
}

function IntegrationsContent() {
  const qc = useQueryClient();
  const search = useSearchParams();
  const [banner, setBanner] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const connected = search.get('connected');
    const error = search.get('error');
    if (connected) setBanner(`${connected} conectado com sucesso (OAuth real).`);
    if (error) setBanner(`Erro na conexão: ${error}`);
  }, [search]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => api.get<Integrations>('/api/v1/integrations'),
  });

  const connect = useMutation({
    mutationFn: async (type: string) => {
      setActionError(null);
      const res = await api.post<{
        data: {
          flow?: string;
          authorizeUrl?: string | null;
          connectToken?: string;
          connectionId?: string;
          message?: string;
        };
      }>(`/api/v1/integrations/${type}/connect`);

      const payload = res.data;

      if (payload.flow === 'oauth_redirect' && payload.authorizeUrl) {
        window.location.href = payload.authorizeUrl;
        return payload;
      }

      if (payload.flow === 'pluggy_widget' && payload.connectToken) {
        await loadPluggyScript();
        if (!window.PluggyConnect) throw new Error('Pluggy Connect indisponível');
        await new Promise<void>((resolve, reject) => {
          const widget = new window.PluggyConnect!({
            connectToken: payload.connectToken!,
            onSuccess: async ({ item }) => {
              try {
                await api.post(`/api/v1/integrations/OPEN_FINANCE/callback`, {
                  itemId: item.id,
                });
                resolve();
              } catch (e) {
                reject(e);
              }
            },
            onError: (err) => reject(new Error(err.message ?? 'Pluggy error')),
            onClose: () => resolve(),
          });
          widget.init();
        });
        return payload;
      }

      if (payload.flow === 'gmail_linked') {
        setBanner(payload.message ?? 'Vinculado ao Gmail.');
        return payload;
      }

      throw new Error(payload.message ?? 'Fluxo de conexão desconhecido');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (err) => {
      setActionError(err instanceof Error ? err.message : 'Falha ao conectar');
    },
  });

  const sync = useMutation({
    mutationFn: (type: string) =>
      api.post<{
        data: {
          ingested: number;
          eventsFetched?: number;
          proposalsCreated?: number;
          real?: boolean;
        };
      }>(`/api/v1/integrations/${type}/sync`),
    onSuccess: (res) => {
      const d = res.data;
      setBanner(
        `Sync real: ${d.eventsFetched ?? 0} eventos lidos, ${d.ingested} novos, ${d.proposalsCreated ?? 0} propostas.`,
      );
      qc.invalidateQueries({ queryKey: ['integrations'] });
      qc.invalidateQueries({ queryKey: ['proposals'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => {
      setActionError(err instanceof Error ? err.message : 'Falha no sync');
    },
  });

  const disconnect = useMutation({
    mutationFn: (type: string) => api.delete(`/api/v1/integrations/${type}?deleteData=false`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations'] }),
  });

  return (
    <div>
      <PageHeader
        title="Integrações"
        description="Somente dados reais. OAuth Gmail/Microsoft, Open Finance Pluggy e recibos de loja via e-mail."
      />

      {banner ? (
        <div className="mb-4 rounded-md border bg-secondary/50 px-4 py-3 text-sm">{banner}</div>
      ) : null}
      {actionError ? (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <p className="mb-6 text-sm text-muted-foreground">
        Ordem recomendada: 1) Gmail → 2) lojas (Play, Apple, Amazon) → 3) Open Finance (Pluggy) →
        4) Microsoft (Graph ou Gmail).
      </p>

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(data?.data ?? []).map((item) => {
            const meta = labels[item.type] ?? { title: item.type, desc: '' };
            const canConnect =
              item.configured !== false &&
              (!item.requiresGmail || item.gmailReady || item.type === 'GMAIL');

            return (
              <Card key={item.type}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{meta.title}</CardTitle>
                      <CardDescription className="mt-1">{meta.desc}</CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={item.connected ? 'success' : 'muted'}>{item.status}</Badge>
                      <Badge variant={item.configured ? 'outline' : 'warning'}>
                        {item.configured ? 'API pronta' : 'Configurar env'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.mode ? (
                    <p className="text-xs text-muted-foreground">{item.mode}</p>
                  ) : null}
                  {item.requiresGmail && !item.gmailReady && !item.connected ? (
                    <p className="text-xs text-amber-800">
                      Requer Gmail conectado para importar recibos reais.
                    </p>
                  ) : null}
                  {item.lastSyncAt ? (
                    <p className="text-xs text-muted-foreground">
                      Última sincronização: {formatDate(item.lastSyncAt)}
                    </p>
                  ) : null}
                  {item.lastError ? (
                    <p className="text-xs text-destructive">{item.lastError}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {!item.connected ? (
                      <Button
                        size="sm"
                        onClick={() => connect.mutate(item.type)}
                        disabled={connect.isPending || !canConnect}
                      >
                        Conectar
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => sync.mutate(item.type)}
                          disabled={sync.isPending}
                        >
                          Sincronizar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => disconnect.mutate(item.type)}
                        >
                          Desconectar
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
