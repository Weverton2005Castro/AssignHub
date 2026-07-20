'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatBRL } from '@/lib/utils';

type Summary = {
  data: {
    totalCents: number;
    byCategory: Record<string, number>;
    byCompany: Record<string, number>;
    projectedMonthlyCents: number;
    activeSubscriptions: number;
  };
};

export default function ReportsPage() {
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(today);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', from, to],
    queryFn: () => api.get<Summary>(`/api/v1/reports/summary?from=${from}&to=${to}`),
  });

  const exportJob = useMutation({
    mutationFn: (format: 'CSV' | 'PDF') =>
      api.post('/api/v1/reports/export', {
        type: 'custom',
        format,
        from,
        to,
      }),
  });

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Resumos mensais, por categoria e exportação."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportJob.mutate('CSV')}>
              Exportar CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportJob.mutate('PDF')}>
              Exportar PDF
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <div>
          <label className="text-xs text-muted-foreground">De</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Até</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total no período</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{formatBRL(data.data.totalCents)}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Projeção mensal atual: {formatBRL(data.data.projectedMonthlyCents)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Por categoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {Object.entries(data.data.byCategory).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span>{k}</span>
                  <span>{formatBRL(v)}</span>
                </div>
              ))}
              {!Object.keys(data.data.byCategory).length ? (
                <p className="text-muted-foreground">Sem dados no período.</p>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Por empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {Object.entries(data.data.byCompany).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span>{k}</span>
                  <span>{formatBRL(v)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {exportJob.isSuccess ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Exportação gerada. Em produção o arquivo fica disponível via URL assinada.
        </p>
      ) : null}
    </div>
  );
}
