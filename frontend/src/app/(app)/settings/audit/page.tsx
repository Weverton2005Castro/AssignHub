'use client';

import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

type Logs = {
  data: Array<{ id: string; action: string; createdAt: string; ipAddress: string | null }>;
};

export default function AuditPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['audit'],
    queryFn: () => api.get<Logs>('/api/v1/audit-logs'),
  });

  return (
    <div>
      <PageHeader title="Auditoria" description="Trilha das suas ações sensíveis." />
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Ação</th>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(data?.data ?? []).map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 font-medium">{l.action}</td>
                  <td className="px-4 py-3">{formatDate(l.createdAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.ipAddress ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
