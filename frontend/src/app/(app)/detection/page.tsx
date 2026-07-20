'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatBRL } from '@/lib/utils';

type Proposals = {
  data: Array<{
    id: string;
    suggestedName: string;
    suggestedAmount: number;
    suggestedPeriod: string;
    confidence: number;
    source: string;
    rationale: string | null;
  }>;
};

export default function DetectionPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => api.get<Proposals>('/api/v1/detection/proposals'),
  });

  const run = useMutation({
    mutationFn: () => api.post('/api/v1/detection/run'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proposals'] }),
  });

  const confirm = useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/detection/proposals/${id}/confirm`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proposals'] });
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const reject = useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/detection/proposals/${id}/reject`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proposals'] }),
  });

  return (
    <div>
      <PageHeader
        title="Detecções"
        description="Confirme assinaturas encontradas automaticamente. O sistema aprende com suas decisões."
        actions={
          <Button variant="outline" onClick={() => run.mutate()} disabled={run.isPending}>
            {run.isPending ? 'Processando…' : 'Reprocessar eventos'}
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data?.data?.length ? (
        <EmptyState
          title="Nada pendente"
          description="Sincronize Gmail ou Open Finance para gerar propostas de assinatura."
          actionLabel="Ir para integrações"
          onAction={() => {
            window.location.href = '/integrations';
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.data.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{p.suggestedName}</CardTitle>
                  <Badge variant="outline">{p.source}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  {formatBRL(p.suggestedAmount)} · {p.suggestedPeriod}
                </p>
                <p className="text-muted-foreground">
                  Confiança: {(p.confidence * 100).toFixed(0)}%
                  {p.rationale ? ` — ${p.rationale}` : ''}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => confirm.mutate(p.id)}>
                    Confirmar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => reject.mutate(p.id)}>
                    Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
