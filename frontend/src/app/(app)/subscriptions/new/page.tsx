'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

type Categories = {
  data: Array<{ id: string; name: string; slug: string }>;
};

export default function NewSubscriptionPage() {
  const router = useRouter();
  const { data: cats } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Categories>('/api/v1/categories'),
  });

  const [form, setForm] = useState({
    name: '',
    company: '',
    categoryId: '',
    amount: '',
    billingPeriod: 'MONTHLY',
    nextBillingDate: new Date().toISOString().slice(0, 10),
    planName: '',
    officialUrl: '',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const amountCents = Math.round(parseFloat(form.amount.replace(',', '.')) * 100);
      const categoryId = form.categoryId || cats?.data?.[0]?.id;
      if (!categoryId) throw new Error('Selecione uma categoria');
      const res = await api.post<{ data: { id: string } }>('/api/v1/subscriptions', {
        name: form.name,
        company: form.company || undefined,
        categoryId,
        amountCents,
        billingPeriod: form.billingPeriod,
        nextBillingDate: form.nextBillingDate,
        planName: form.planName || undefined,
        officialUrl: form.officialUrl || undefined,
        notes: form.notes || undefined,
        autoRenew: true,
      });
      router.push(`/subscriptions/${res.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Nova assinatura" description="Cadastro manual completo." />
      <Card>
        <CardContent className="pt-6">
          <form className="space-y-4" onSubmit={onSubmit}>
            <Field label="Nome">
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Empresa">
              <Input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </Field>
            <Field label="Categoria">
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                <option value="">Selecione…</option>
                {(cats?.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Valor (R$)">
                <Input
                  required
                  inputMode="decimal"
                  placeholder="55,90"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </Field>
              <Field label="Periodicidade">
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={form.billingPeriod}
                  onChange={(e) => setForm({ ...form, billingPeriod: e.target.value })}
                >
                  {['WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY'].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Próxima cobrança">
              <Input
                type="date"
                required
                value={form.nextBillingDate}
                onChange={(e) => setForm({ ...form, nextBillingDate: e.target.value })}
              />
            </Field>
            <Field label="Plano">
              <Input
                value={form.planName}
                onChange={(e) => setForm({ ...form, planName: e.target.value })}
              />
            </Field>
            <Field label="Site oficial">
              <Input
                type="url"
                placeholder="https://"
                value={form.officialUrl}
                onChange={(e) => setForm({ ...form, officialUrl: e.target.value })}
              />
            </Field>
            <Field label="Observações">
              <textarea
                className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando…' : 'Salvar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
