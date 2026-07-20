'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

type Msg = { role: 'user' | 'assistant'; content: string };

const suggestions = [
  'Quanto gasto com streaming?',
  'Qual assinatura mais cara?',
  'Quanto gastarei nos próximos sete dias?',
  'Quais assinaturas posso cancelar?',
  'Quanto gasto com IA?',
];

export default function AiPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      content:
        'Sou o copiloto financeiro. Pergunte sobre gastos, previsões, desperdícios ou cancelamentos. Uso dados reais da sua conta.',
    },
  ]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();

  const chat = useMutation({
    mutationFn: (message: string) =>
      api.post<{ data: { message: string; conversationId: string } }>('/api/v1/ai/chat', {
        message,
        conversationId,
      }),
    onSuccess: (res) => {
      setConversationId(res.data.conversationId);
      setMessages((m) => [...m, { role: 'assistant', content: res.data.message }]);
    },
    onError: (err) => {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Erro ao consultar o copiloto.',
        },
      ]);
    },
  });

  function send(text: string) {
    const message = text.trim();
    if (!message || chat.isPending) return;
    setMessages((m) => [...m, { role: 'user', content: message }]);
    setInput('');
    chat.mutate(message);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <PageHeader
        title="Copiloto"
        description="Perguntas em linguagem natural com números verificáveis."
      />

      <div className="mb-3 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <Button key={s} size="sm" variant="outline" onClick={() => send(s)}>
            {s}
          </Button>
        ))}
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {chat.isPending ? (
              <p className="text-xs text-muted-foreground">Analisando seus dados…</p>
            ) : null}
          </div>
          <form
            className="flex gap-2 border-t p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex.: Quanto já paguei na Netflix?"
              disabled={chat.isPending}
            />
            <Button type="submit" disabled={chat.isPending || !input.trim()}>
              Enviar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
