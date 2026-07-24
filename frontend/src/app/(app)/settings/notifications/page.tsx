'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

type Preferences = {
  data: {
    channels: string[];
    chargeReminders: boolean;
    priceIncrease: boolean;
    newDetections: boolean;
    savingsTips: boolean;
    marketing: boolean;
  };
};

export default function NotificationPreferencesPage() {
  const qc = useQueryClient();
  const [channels, setChannels] = useState<string[]>(['IN_APP']);
  const [chargeReminders, setChargeReminders] = useState(true);
  const [priceIncrease, setPriceIncrease] = useState(true);
  const [newDetections, setNewDetections] = useState(true);
  const [savingsTips, setSavingsTips] = useState(true);
  const [marketing, setMarketing] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => api.get<Preferences>('/api/v1/notifications/preferences'),
  });

  useEffect(() => {
    if (data?.data) {
      setChannels(data.data.channels);
      setChargeReminders(data.data.chargeReminders);
      setPriceIncrease(data.data.priceIncrease);
      setNewDetections(data.data.newDetections);
      setSavingsTips(data.data.savingsTips);
      setMarketing(data.data.marketing);
    }
  }, [data]);

  const update = useMutation({
    mutationFn: () =>
      api.put('/api/v1/notifications/preferences', {
        channels,
        chargeReminders,
        priceIncrease,
        newDetections,
        savingsTips,
        marketing,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });

  const toggleChannel = (channel: string) => {
    setChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel],
    );
  };

  if (isLoading) return <Skeleton className="h-64" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader
        title="Preferências de notificação"
        description="Configure como e quando você quer ser alertado."
      />

      <div className="max-w-2xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Canais de notificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {['IN_APP', 'EMAIL', 'PUSH'].map((channel) => (
              <div key={channel} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {channel === 'IN_APP' ? 'No aplicativo' : channel === 'EMAIL' ? 'E-mail' : 'Push'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {channel === 'IN_APP'
                      ? 'Notificações dentro do sistema'
                      : channel === 'EMAIL'
                      ? 'Receba alertas por e-mail'
                      : 'Notificações no dispositivo móvel'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={channels.includes(channel)}
                  onChange={() => toggleChannel(channel)}
                  className="h-4 w-4"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tipos de alerta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Lembretes de cobrança</p>
                <p className="text-sm text-muted-foreground">
                  Alertas antes e no dia da cobrança
                </p>
              </div>
              <input
                type="checkbox"
                checked={chargeReminders}
                onChange={(e) => setChargeReminders(e.target.checked)}
                className="h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Aumentos de preço</p>
                <p className="text-sm text-muted-foreground">
                  Avisos quando uma assinatura aumentar de valor
                </p>
              </div>
              <input
                type="checkbox"
                checked={priceIncrease}
                onChange={(e) => setPriceIncrease(e.target.checked)}
                className="h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Novas detecções</p>
                <p className="text-sm text-muted-foreground">
                  Alertas quando o sistema encontrar novas assinaturas
                </p>
              </div>
              <input
                type="checkbox"
                checked={newDetections}
                onChange={(e) => setNewDetections(e.target.checked)}
                className="h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dicas de economia</p>
                <p className="text-sm text-muted-foreground">
                  Sugestões personalizadas para reduzir gastos
                </p>
              </div>
              <input
                type="checkbox"
                checked={savingsTips}
                onChange={(e) => setSavingsTips(e.target.checked)}
                className="h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Marketing</p>
                <p className="text-sm text-muted-foreground">
                  Novidades e atualizações do sistema
                </p>
              </div>
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="h-4 w-4"
              />
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={() => update.mutate()}
          disabled={update.isPending}
          className="w-full"
        >
          {update.isPending ? 'Salvando...' : 'Salvar preferências'}
        </Button>
      </div>
    </div>
  );
}
