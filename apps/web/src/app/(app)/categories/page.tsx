'use client';

import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

type Cats = {
  data: Array<{ id: string; name: string; slug: string; isSystem: boolean }>;
};

export default function CategoriesPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Cats>('/api/v1/categories'),
  });

  return (
    <div>
      <PageHeader
        title="Categorias"
        description="Categorias do sistema e personalizadas."
      />
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
                <Badge variant={c.isSystem ? 'secondary' : 'outline'}>
                  {c.isSystem ? 'Sistema' : 'Custom'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
