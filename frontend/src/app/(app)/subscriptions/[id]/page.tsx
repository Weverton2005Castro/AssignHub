'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatBRL, formatDate } from '@/lib/utils';
import Link from 'next/link';

type SubDetail = {
  data: {
    id: string;
    name: string;
    company: string | null;
    amountCents: number;
    billingPeriod: string;
    status: string;
    source: string;
    nextBillingDate: string;
    planName: string | null;
    notes: string | null;
    officialUrl: string | null;
    unused: boolean;
    autoRenew: boolean;
    category: { name: string };
    priceHistories: Array<{ amountCents: number; effectiveFrom: string; note: string | null }>;
  };
};

export default function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['subscription', id],
    queryFn: () => api.get<SubDetail>(`/api/v1/subscriptions/${id}`),
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/api/v1/subscriptions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      router.push('/subscriptions');
    },
  });

  const toggleUnused = useMutation({
    mutationFn: () =>
      api.patch(`/api/v1/subscriptions/${id}`, { unused: !data?.data.unused }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscription', id] }),
  });

  if (isLoading) return <Skeleton className="h-64" />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const s = data.data;

  return (
    <div>
      <PageHeader
        title={s.name}
        description={s.company ?? undefined}
        actions={
          <>
            <Link href={`/subscriptions/${id}/edit`}>
              <Button variant="outline">Editar</Button>
            </Link>
            <Button variant="outline" onClick={() => toggleUnused.mutate()}>
              {s.unused ? 'Marcar como em uso' : 'Marcar sem uso'}
            </Button>
            <Button variant="destructive" onClick={() => remove.mutate()}>
              Cancelar / arquivar
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <Row label="Valor" value={`${formatBRL(s.amountCents)} / ${s.billingPeriod}`} />
            <Row label="Status" value={s.status} />
            <Row label="Categoria" value={s.category.name} />
            <Row label="Fonte" value={s.source} />
            <Row label="Próxima cobrança" value={formatDate(s.nextBillingDate)} />
            <Row label="Renovação automática" value={s.autoRenew ? 'Sim' : 'Não'} />
            <Row label="Plano" value={s.planName ?? '—'} />
            <Row label="Site" value={s.officialUrl ?? '—'} />
            {s.notes ? (
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">Observações</p>
                <p className="mt-1">{s.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de preço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {s.priceHistories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem histórico.</p>
            ) : (
              s.priceHistories.map((h, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{formatDate(h.effectiveFrom)}</span>
                  <span>{formatBRL(h.amountCents)}</span>
                </div>
              ))
            )}
            {s.unused ? <Badge variant="warning">Marcada como sem uso</Badge> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}
