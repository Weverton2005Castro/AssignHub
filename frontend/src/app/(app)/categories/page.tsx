'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

type Cats = {
  data: Array<{ id: string; name: string; slug: string; isSystem: boolean }>;
};

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [name, setName] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Cats>('/api/v1/categories'),
  });

  const create = useMutation({
    mutationFn: () =>
      api.post('/api/v1/categories', {
        name,
      }),
    onSuccess: () => {
      setName('');
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  return (
    <div>
      <PageHeader
        title="Categorias"
        description="Categorias do sistema e personalizadas."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Nova categoria</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Nome da categoria"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            Criar
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.data ?? []).map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={c.isSystem ? 'secondary' : 'outline'}>
                    {c.isSystem ? 'Sistema' : 'Custom'}
                  </Badge>
                  {!c.isSystem && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => remove.mutate(c.id)}
                      disabled={remove.isPending}
                    >
                      Excluir
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
