'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatBRL } from '@/lib/utils';

type CalendarRes = {
  data: {
    year: number;
    month: number;
    days: Record<
      string,
      Array<{ id: string; amountCents: number; subscription: { name: string } }>
    >;
  };
};

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['calendar', year, month],
    queryFn: () =>
      api.get<CalendarRes>(`/api/v1/charges/calendar?year=${year}&month=${month}`),
  });

  const cells = useMemo(() => {
    const first = new Date(year, month - 1, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const items: Array<{ day: number | null; key: string }> = [];
    for (let i = 0; i < startPad; i++) items.push({ day: null, key: `pad-${i}` });
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      items.push({ day: d, key });
    }
    return items;
  }, [year, month]);

  function prev() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }
  function next() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

  return (
    <div>
      <PageHeader
        title="Calendário"
        description="Cobranças do mês"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={prev}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={next}>
              Próximo
            </Button>
          </div>
        }
      />
      <p className="mb-4 text-sm text-muted-foreground">
        {String(month).padStart(2, '0')}/{year}
      </p>

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
            <div key={d} className="px-1 py-2 text-center text-xs text-muted-foreground">
              {d}
            </div>
          ))}
          {cells.map((c) => {
            const charges = c.day ? data?.data.days[c.key] ?? [] : [];
            return (
              <Card
                key={c.key}
                className={`min-h-[88px] ${c.day ? '' : 'border-transparent shadow-none'}`}
              >
                <CardContent className="p-2">
                  {c.day ? (
                    <>
                      <p className="text-xs font-medium">{c.day}</p>
                      <div className="mt-1 space-y-1">
                        {charges.slice(0, 3).map((ch) => (
                          <p key={ch.id} className="truncate text-[10px] text-muted-foreground">
                            {ch.subscription.name} {formatBRL(ch.amountCents)}
                          </p>
                        ))}
                        {charges.length > 3 ? (
                          <p className="text-[10px] text-muted-foreground">+{charges.length - 3}</p>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
