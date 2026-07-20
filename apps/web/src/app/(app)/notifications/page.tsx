'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

type Notifs = {
  data: Array<{
    id: string;
    title: string;
    body: string;
    type: string;
    readAt: string | null;
    createdAt: string;
  }>;
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notifs>('/api/v1/notifications'),
  });

  const readAll = useMutation({
    mutationFn: () => api.post('/api/v1/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div>
      <PageHeader
        title="Notificações"
        description="Alertas de cobrança, detecções e economia."
        actions={
          <Button variant="outline" size="sm" onClick={() => readAll.mutate()}>
            Marcar todas como lidas
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data?.data?.length ? (
        <EmptyState title="Caixa vazia" description="Quando houver alertas, eles aparecem aqui." />
      ) : (
        <div className="space-y-2">
          {data.data.map((n) => (
            <Card key={n.id} className={n.readAt ? 'opacity-70' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(n.createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
