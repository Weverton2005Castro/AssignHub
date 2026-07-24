'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [source, setSource] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['subscriptions', search, status, category, source],
    queryFn: () => {
      const params = new URLSearchParams({ pageSize: '100' });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (category) params.set('category', category);
      if (source) params.set('source', source);
      return api.get<SubList>(`/api/v1/subscriptions?${params.toString()}`);
    },
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

      <Card className="mb-6">
        <CardContent className="flex flex-wrap gap-3 p-4">
          <Input
            placeholder="Buscar por nome ou empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="CANCELLED">Cancelado</option>
            <option value="TRIAL">Trial</option>
            <option value="PAUSED">Pausado</option>
          </select>
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value="">Todas as fontes</option>
            <option value="MANUAL">Manual</option>
            <option value="OPEN_FINANCE">Open Finance</option>
            <option value="EMAIL">E-mail</option>
            <option value="GOOGLE_PLAY">Google Play</option>
            <option value="APPLE">Apple</option>
          </select>
          {(search || status || category || source) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatus('');
                setCategory('');
                setSource('');
              }}
            >
              Limpar filtros
            </Button>
          )}
        </CardContent>
      </Card>

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
