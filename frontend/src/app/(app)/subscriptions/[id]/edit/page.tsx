'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatBRL } from '@/lib/utils';

type SubDetail = {
  data: {
    id: string;
    name: string;
    company: string | null;
    amountCents: number;
    billingPeriod: string;
    status: string;
    nextBillingDate: string;
    planName: string | null;
    notes: string | null;
    officialUrl: string | null;
    autoRenew: boolean;
    categoryId: string;
    category: { id: string; name: string };
  };
};

type Categories = {
  data: Array<{ id: string; name: string }>;
};

export default function SubscriptionEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [amountCents, setAmountCents] = useState('');
  const [billingPeriod, setBillingPeriod] = useState('MONTHLY');
  const [nextBillingDate, setNextBillingDate] = useState('');
  const [planName, setPlanName] = useState('');
  const [notes, setNotes] = useState('');
  const [officialUrl, setOfficialUrl] = useState('');
  const [autoRenew, setAutoRenew] = useState(true);
  const [categoryId, setCategoryId] = useState('');

  const { data: subData, isLoading: subLoading, isError: subError, refetch } = useQuery({
    queryKey: ['subscription', id],
    queryFn: () => api.get<SubDetail>(`/api/v1/subscriptions/${id}`),
  });

  useEffect(() => {
    if (subData?.data) {
      setName(subData.data.name);
      setCompany(subData.data.company ?? '');
      setAmountCents(String(subData.data.amountCents));
      setBillingPeriod(subData.data.billingPeriod);
      setNextBillingDate(subData.data.nextBillingDate.split('T')[0]);
      setPlanName(subData.data.planName ?? '');
      setNotes(subData.data.notes ?? '');
      setOfficialUrl(subData.data.officialUrl ?? '');
      setAutoRenew(subData.data.autoRenew);
      setCategoryId(subData.data.categoryId);
    }
  }, [subData]);

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Categories>('/api/v1/categories'),
  });

  const update = useMutation({
    mutationFn: () =>
      api.patch(`/api/v1/subscriptions/${id}`, {
        name,
        company: company || null,
        amountCents: parseInt(amountCents, 10),
        billingPeriod,
        nextBillingDate: new Date(nextBillingDate).toISOString(),
        planName: planName || null,
        notes: notes || null,
        officialUrl: officialUrl || null,
        autoRenew,
        categoryId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription', id] });
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      router.push(`/subscriptions/${id}`);
    },
  });

  if (subLoading) return <Skeleton className="h-64" />;
  if (subError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader
        title="Editar assinatura"
        description="Altere os dados da assinatura"
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        }
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Dados da assinatura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Nome</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Empresa</label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Valor (centavos)</label>
            <Input
              type="number"
              value={amountCents}
              onChange={(e) => setAmountCents(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Equivalente: {formatBRL(parseInt(amountCents, 10) || 0)}
            </p>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Período de cobrança</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={billingPeriod}
              onChange={(e) => setBillingPeriod(e.target.value)}
            >
              <option value="WEEKLY">Semanal</option>
              <option value="MONTHLY">Mensal</option>
              <option value="QUARTERLY">Trimestral</option>
              <option value="SEMIANNUAL">Semestral</option>
              <option value="YEARLY">Anual</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Próxima cobrança</label>
            <Input
              type="date"
              value={nextBillingDate}
              onChange={(e) => setNextBillingDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Categoria</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {catData?.data.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Plano</label>
            <Input value={planName} onChange={(e) => setPlanName(e.target.value)} />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Site oficial</label>
            <Input value={officialUrl} onChange={(e) => setOfficialUrl(e.target.value)} />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Observações</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoRenew"
              checked={autoRenew}
              onChange={(e) => setAutoRenew(e.target.checked)}
            />
            <label htmlFor="autoRenew" className="text-sm">
              Renovação automática
            </label>
          </div>

          <Button
            onClick={() => update.mutate()}
            disabled={update.isPending}
            className="w-full"
          >
            {update.isPending ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
