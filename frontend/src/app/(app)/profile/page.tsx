'use client';

import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

type Me = {
  data: {
    id: string;
    email: string;
    name: string;
    locale: string;
    timezone: string;
    currency: string;
  };
};

export default function ProfilePage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<Me>('/api/v1/me'),
  });

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Perfil" description="Dados pessoais e preferências regionais." />
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{data.data.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="E-mail" value={data.data.email} />
            <Row label="Idioma" value={data.data.locale} />
            <Row label="Fuso" value={data.data.timezone} />
            <Row label="Moeda" value={data.data.currency} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
