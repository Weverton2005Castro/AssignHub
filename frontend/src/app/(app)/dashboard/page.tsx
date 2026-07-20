'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatBRL, formatDate } from '@/lib/utils';

type DashboardData = {
  data: {
    totals: {
      activeSubscriptions: number;
      monthlySpendCents: number;
      yearlySpendCents: number;
    };
    nextCharge: {
      name: string;
      amountCents: number;
      date: string;
    } | null;
    forgotten: Array<{ id: string; name: string; amountCents: number }>;
    possibleSavingsCents: number;
    byCategory: Array<{ slug: string; name: string; monthlyCents: number }>;
    pendingProposals: number;
    insights: Array<{ id: string; title: string; body: string; severity: string }>;
    timeline: Array<{
      id: string;
      amountCents: number;
      dueDate: string;
      status: string;
      subscription: { name: string };
    }>;
    aiSummary: string;
  };
};

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardData>('/api/v1/dashboard'),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const d = data.data;
  const chartData = d.byCategory.map((c) => ({
    name: c.name,
    value: c.monthlyCents / 100,
  }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão consolidada das suas assinaturas e gastos recorrentes."
        actions={
          <Link href="/subscriptions/new">
            <Button>Nova assinatura</Button>
          </Link>
        }
      />

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Resumo do copiloto</CardTitle>
          <CardDescription>Gerado a partir dos seus dados</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground/90">{d.aiSummary}</p>
          {d.pendingProposals > 0 ? (
            <div className="mt-4">
              <Link href="/detection">
                <Badge variant="warning">
                  {d.pendingProposals} detecção(ões) aguardando confirmação
                </Badge>
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Assinaturas ativas" value={String(d.totals.activeSubscriptions)} />
        <MetricCard label="Gasto mensal" value={formatBRL(d.totals.monthlySpendCents)} />
        <MetricCard label="Gasto anual (est.)" value={formatBRL(d.totals.yearlySpendCents)} />
        <MetricCard
          label="Próxima cobrança"
          value={
            d.nextCharge
              ? `${d.nextCharge.name} · ${formatBRL(d.nextCharge.amountCents)}`
              : '—'
          }
          hint={d.nextCharge ? formatDate(d.nextCharge.date) : undefined}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados para gráfico.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatBRL(Math.round(v * 100))} />
                  <Bar dataKey="value" fill="hsl(240 6% 20%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Economia e esquecidas</CardTitle>
            <CardDescription>
              Economia possível: {formatBRL(d.possibleSavingsCents)}/mês
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {d.forgotten.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma assinatura marcada como sem uso.
              </p>
            ) : (
              d.forgotten.map((f) => (
                <div key={f.id} className="flex items-center justify-between text-sm">
                  <Link href={`/subscriptions/${f.id}`} className="hover:underline">
                    {f.name}
                  </Link>
                  <span className="text-muted-foreground">{formatBRL(f.amountCents)}</span>
                </div>
              ))
            )}
            {d.insights.slice(0, 3).map((i) => (
              <div key={i.id} className="rounded-md border p-3">
                <p className="text-sm font-medium">{i.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{i.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Linha do tempo</CardTitle>
        </CardHeader>
        <CardContent>
          {d.timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem cobranças recentes.</p>
          ) : (
            <ul className="divide-y">
              {d.timeline.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{t.subscription.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(t.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p>{formatBRL(t.amountCents)}</p>
                    <Badge variant="muted" className="mt-1">
                      {t.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-xl font-semibold tracking-tight">{value}</CardTitle>
      </CardHeader>
      {hint ? (
        <CardContent>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}
