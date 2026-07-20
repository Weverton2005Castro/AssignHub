'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatBRL } from '@/lib/utils';

type Goals = {
  data: Array<{
    id: string;
    title: string;
    type: string;
    targetCents: number | null;
    currentCents: number;
    status: string;
  }>;
};

export default function GoalsPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('100');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['goals'],
    queryFn: () => api.get<Goals>('/api/v1/goals'),
  });

  const create = useMutation({
    mutationFn: () =>
      api.post('/api/v1/goals', {
        type: 'SAVE_AMOUNT',
        title: title || 'Economizar no mês',
        targetCents: Math.round(parseFloat(target) * 100),
      }),
    onSuccess: () => {
      setTitle('');
      qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  return (
    <div>
      <PageHeader title="Metas" description="Economia, cancelamentos e redução por categoria." />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Nova meta de economia</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            placeholder="Valor R$"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            Criar
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-32" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data?.data?.length ? (
        <EmptyState title="Sem metas" description="Defina um objetivo de economia mensal." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.data.map((g) => {
            const pct =
              g.targetCents && g.targetCents > 0
                ? Math.min(100, Math.round((g.currentCents / g.targetCents) * 100))
                : 0;
            return (
              <Card key={g.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{g.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-muted-foreground">
                    {formatBRL(g.currentCents)} de{' '}
                    {g.targetCents ? formatBRL(g.targetCents) : '—'} · {g.status}
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
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
