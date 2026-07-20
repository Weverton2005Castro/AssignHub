# Frontend — Telas, UX e estados

## 1. Princípios UX

1. **Poucos cliques**: ações primárias visíveis; confirmação só quando destrutivo ou financeiro irreversível.
2. **Progressive disclosure**: conectar integrações é opcional no onboarding.
3. **Confiança**: toda detecção automática pede confirmação explícita.
4. **Clareza numérica**: valores em BRL formatados; centavos nunca ambíguos.
5. **Estados honestos**: loading skeleton, empty com CTA, error com retry.
6. **Acessibilidade**: foco visível, labels, contraste AA, navegação teclado.
7. **Visual**: neutros (zinc/slate), um accent (preto/quase-preto ou azul sóbrio), sem emojis, sem ilustrações decorativas excessivas.

## 2. Shell da aplicação

- **Desktop**: sidebar colapsável + topbar (busca, AI, notificações, avatar)
- **Tablet**: sidebar ícones
- **Mobile**: bottom nav (Home, Assinaturas, Calendário, AI, Mais)

## 3. Mapa de telas

### Auth

| Rota | Tela |
|------|------|
| `/login` | Login e-mail + sociais |
| `/register` | Cadastro |
| `/forgot-password` | Recuperação |
| `/reset-password` | Nova senha |
| `/verify-email` | Confirmação |
| `/onboarding` | Wizard LGPD + preferências + integrações opcionais |

### App

| Rota | Tela |
|------|------|
| `/dashboard` | Overview financeiro |
| `/subscriptions` | Lista |
| `/subscriptions/new` | Formulário |
| `/subscriptions/[id]` | Detalhe |
| `/subscriptions/[id]/edit` | Edição |
| `/charges` | Histórico de cobranças |
| `/calendar` | Calendário mensal |
| `/categories` | Categorias e gastos |
| `/detection` | Propostas pendentes |
| `/integrations` | Contas conectadas |
| `/integrations/[type]` | Detalhe / sync |
| `/ai` | Copiloto chat |
| `/reports` | Relatórios + export |
| `/goals` | Metas |
| `/notifications` | Inbox |
| `/profile` | Dados pessoais |
| `/settings` | Preferências, privacidade, segurança |
| `/settings/audit` | Meus logs |
| `/settings/danger` | Exportar / excluir conta |

## 4. Dashboard — layout

```
┌──────────────────────────────────────────────────────────┐
│  Resumo IA (card largo, texto + “Atualizado há …”)       │
├────────────┬────────────┬────────────┬───────────────────┤
│ Assinaturas│ Gasto mês  │ Gasto ano  │ Próxima cobrança  │
├────────────┴────────────┼────────────┴───────────────────┤
│ Gráfico evolução        │ Por categoria (barras)         │
├─────────────────────────┼────────────────────────────────┤
│ Alertas                 │ Esquecidas / economia          │
├─────────────────────────┴────────────────────────────────┤
│ Timeline recente                                         │
└──────────────────────────────────────────────────────────┘
```

## 5. Estados por tela (padrão)

| Estado | Comportamento |
|--------|---------------|
| Loading | Skeleton com mesma geometria do conteúdo |
| Empty | Título + descrição + CTA primário |
| Error | Mensagem legível + botão Tentar novamente |
| Partial | Integração falhou: banner não bloqueante |
| Success toast | Após mutações (sonner/shadcn) |

## 6. Fluxos críticos (wireflow)

### Criar assinatura manual

Lista → Nova → Form validado → Salvar → Detalhe (1 redirecionamento)

### Confirmar detecção

Banner dashboard ou /detection → Card proposta → Confirmar (inline edit opcional) → Some da fila

### Pergunta IA

/ai ou Command palette (Ctrl+K) → Input → Streaming resposta → Sugestões de follow-up

### Conectar Gmail

Integrações → Gmail → OAuth popup/redirect → Sync progress → Propostas

## 7. Componentes de domínio

- `SubscriptionCard`, `SubscriptionForm`, `PriceHistoryChart`
- `ChargeCalendar`, `MoneyText`, `StatusBadge`
- `ProposalCard`, `InsightList`, `AiChat`
- `IntegrationStatus`, `EmptyState`, `PageHeader`
- `ConfirmDialog` (destrutivo)

## 8. Estado cliente

- **React Query**: server state (listas, detalhe, dashboard)
- **Zustand**: UI (sidebar, command palette, draft de filtros)
- **Auth.js**: sessão web

## 9. Performance frontend

- Route-based code splitting (App Router)
- Images: next/image para logos
- Prefetch de rotas da sidebar
- Virtualização em listas longas (charges)

## 10. Design tokens (resumo)

- Font: Inter / system UI
- Radius: 6–8px
- Border: zinc-200 / zinc-800
- Background: white / zinc-50
- Text: zinc-900 / zinc-500 secondary
- Accent: zinc-900 buttons primary (modo claro)
