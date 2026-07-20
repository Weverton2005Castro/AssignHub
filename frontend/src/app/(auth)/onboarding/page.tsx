'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

const steps = [
  {
    title: 'Bem-vindo ao SubscriptionHub',
    body: 'Vamos configurar o essencial. Você pode pular integrações e adicionar depois.',
  },
  {
    title: 'Conecte fontes (opcional)',
    body: 'Open Finance e Gmail permitem descobrir assinaturas automaticamente. Seus dados ficam isolados e cifrados.',
  },
  {
    title: 'Pronto',
    body: 'Cadastre uma assinatura manualmente ou deixe o motor de detecção trabalhar após a sincronização.',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  async function finish() {
    setLoading(true);
    try {
      await api.patch('/api/v1/me', { completeOnboarding: true });
    } catch {
      // allow continue if API offline in pure UI mode
    } finally {
      setLoading(false);
      router.push('/dashboard');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <p className="text-xs text-muted-foreground">
            Passo {step + 1} de {steps.length}
          </p>
          <CardTitle>{steps[step].title}</CardTitle>
          <CardDescription>{steps[step].body}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-between gap-2">
          <Button
            variant="ghost"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Voltar
          </Button>
          {step < steps.length - 1 ? (
            <div className="flex gap-2">
              {step === 1 ? (
                <Button variant="outline" onClick={() => router.push('/integrations')}>
                  Ver integrações
                </Button>
              ) : null}
              <Button onClick={() => setStep((s) => s + 1)}>Continuar</Button>
            </div>
          ) : (
            <Button onClick={finish} disabled={loading}>
              {loading ? 'Salvando…' : 'Ir ao dashboard'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
