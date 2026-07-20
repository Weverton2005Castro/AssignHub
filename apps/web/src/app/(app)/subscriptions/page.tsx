'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatBRL, formatDate } from '@/lib/utils';

type SubList = {
  data: Array<{
    id: string;
    name: string;
    company: string | null;
    amountCents: number;
    billingPeriod: string;
    status: string;
    nextBillingDate: string;
    source: string;
    category: { name: string };
  }>;
  meta: { total: number };
};

export default function SubscriptionsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => api.get<SubList>('/api/v1/subscriptions?pageSize=100'),
  });

  return (
    <div>
      <PageHeader
        title="Assinaturas"
        description="Todas as recorrências em um só lugar."
        actions={
          <Link href="/subscriptions/new">
            <Button>Nova assinatura</Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data?.data?.length ? (
        <EmptyState
          title="Nenhuma assinatura"
          description="Cadastre manualmente ou conecte Open Finance / Gmail para detectar automaticamente."
          actionLabel="Nova assinatura"
          onAction={() => {
            window.location.href = '/subscriptions/new';
          }}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Categoria</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Próxima</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Fonte</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.data.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/subscriptions/${s.id}`} className="font-medium hover:underline">
                      {s.name}
                    </Link>
                    {s.company ? (
                      <p className="text-xs text-muted-foreground">{s.company}</p>
                    ) : null}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">{s.category.name}</td>
                  <td className="px-4 py-3">
                    {formatBRL(s.amountCents)}
                    <span className="text-xs text-muted-foreground"> / {s.billingPeriod}</span>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    {formatDate(s.nextBillingDate)}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <Badge variant="outline">{s.source}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={s.status === 'ACTIVE' ? 'success' : 'muted'}>{s.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
