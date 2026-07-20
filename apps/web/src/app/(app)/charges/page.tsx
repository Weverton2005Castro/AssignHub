'use client';

import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatBRL, formatDate } from '@/lib/utils';

type ChargesRes = {
  data: Array<{
    id: string;
    amountCents: number;
    dueDate: string;
    status: string;
    subscription: { name: string };
  }>;
};

export default function ChargesPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['charges'],
    queryFn: () => api.get<ChargesRes>('/api/v1/charges'),
  });

  return (
    <div>
      <PageHeader title="Cobranças" description="Histórico e programadas." />
      {isLoading ? (
        <Skeleton className="h-48" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data?.data?.length ? (
        <EmptyState
          title="Sem cobranças"
          description="Cobranças aparecem ao cadastrar ou sincronizar assinaturas."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Serviço</th>
                <th className="px-4 py-3 text-left font-medium">Data</th>
                <th className="px-4 py-3 text-left font-medium">Valor</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.data.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium">{c.subscription.name}</td>
                  <td className="px-4 py-3">{formatDate(c.dueDate)}</td>
                  <td className="px-4 py-3">{formatBRL(c.amountCents)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="muted">{c.status}</Badge>
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
