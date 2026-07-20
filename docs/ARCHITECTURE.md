# Arquitetura — SubscriptionHub

## 1. Visão geral

SubscriptionHub é um monorepo full-stack orientado a domínios (modular monolith no backend, com fronteiras claras para eventual extração de serviços).

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clientes                                 │
│  Web (Next.js)  ·  PWA  ·  Push (FCM)  ·  E-mail                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / JWT
┌────────────────────────────▼────────────────────────────────────┐
│                    Edge / CDN (Vercel)                           │
│              Auth.js session · RSC · ISR                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST / BFF
┌────────────────────────────▼────────────────────────────────────┐
│                 API Gateway layer (NestJS)                       │
│  Auth · Rate limit · Validation · OpenAPI · Audit middleware     │
├──────────────────────────────────────────────────────────────────┤
│  Domínios                                                         │
│  Users · Auth · Subscriptions · Categories · Charges · Goals     │
│  Notifications · Reports · Integrations · Detection · AI · Audit │
├──────────────────────────────────────────────────────────────────┤
│  Workers (BullMQ)                                                 │
│  Sync Open Finance · Gmail crawl · Detection · Insights · Alerts │
└────────────┬───────────────────┬───────────────────┬────────────┘
             │                   │                   │
      PostgreSQL              Redis            Supabase Storage
             │                   │                   │
      OpenAI API          Open Finance         OAuth providers
                          (Brasil)             Google/Apple/MS
```

### Decisões arquiteturais

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Modular monolith | NestJS modules | Velocidade inicial + fronteiras para microserviços futuros |
| REST + OpenAPI | Em vez de GraphQL no MVP | Cache HTTP, simplicidade, contrato estável para mobile futuro |
| Prisma | ORM tipado | Migrations, type-safety, produtividade |
| BullMQ + Redis | Jobs assíncronos | Syncs longos, detecção e IA sem bloquear request |
| Auth híbrida | Auth.js no web + JWT na API | UX social no browser; API stateless e multi-cliente |
| RAG seletivo | Embeddings só em histórico/docs longos | Custo controlado; function calling para dados estruturados |
| Multi-tenant por `userId` | Row-level isolation | Pessoas físicas; futuro: `householdId` para famílias |

## 2. Bounded contexts

1. **Identity & Access** — usuários, sessões, OAuth, tokens, permissões
2. **Subscriptions** — catálogo de assinaturas, planos, status, histórico de preço
3. **Billing Events** — cobranças, calendário, métodos de pagamento
4. **Detection Engine** — normalização, matching, confirmação, aprendizado
5. **Integrations** — Open Finance, Gmail, Google Play, Apple, Amazon, Microsoft
6. **Intelligence** — copiloto, insights, previsões, desperdícios
7. **Notifications** — e-mail, push, preferências, in-app
8. **Reporting** — agregações, PDF/CSV, comparativos
9. **Goals** — metas de economia e redução
10. **Audit & Compliance** — logs imutáveis, LGPD, consentimentos

## 3. Fluxos principais

### 3.1 Onboarding

```
Registro/Login → Aceite LGPD → Preferências básicas
  → Conectar fontes (opcional) → Sync inicial (async)
  → Detecção de candidatos → Confirmação do usuário
  → Dashboard com dados + resumo IA
```

### 3.2 Detecção de recorrência

```
Eventos brutos (transação/e-mail/loja)
  → Normalizer (merchant, valor, data)
  → Candidate Matcher (hash de features + embeddings leves)
  → Score de recorrência
  → Se score >= limiar: Proposal (pending_confirmation)
  → Usuário confirma / rejeita / edita
  → Learner persiste regra (merchant aliases, padrões)
  → Subscription criada/atualizada + Charge gerada
```

### 3.3 Copiloto IA

```
Pergunta do usuário
  → Classificador de intenção (function calling)
  → Tools: query_subscriptions, query_charges, compute_savings...
  → Execução com escopo userId (nunca cross-tenant)
  → Resposta + citações de dados + ações sugeridas
  → Log de auditoria da interação
```

### 3.4 Alertas

```
Scheduler (cron) / Eventos
  → Regras: D-1, D0, trial ending, price up, duplicate, waste
  → Preferências do usuário
  → Canal: in-app + e-mail + FCM
  → Idempotência por (userId, type, entityId, day)
```

## 4. Escalabilidade (centenas de milhares de usuários)

- **Horizontal API**: stateless JWT; sticky session desnecessária
- **PostgreSQL**: índices compostos por `userId`; partição futura de `charges` e `audit_logs` por mês
- **Redis**: cache de dashboard (TTL curto), rate limit distribuído, filas
- **Workers**: filas por prioridade (`critical`, `sync`, `ai`, `bulk`)
- **Leitura pesada**: materialização de agregados diários (`daily_spend_stats`)
- **Uploads**: direto para Supabase com signed URLs
- **Rate limits**: por IP + por userId + por endpoint sensível (AI, sync)

## 5. Multi-região e disponibilidade (fase 2+)

- API e workers em 2 AZs
- Postgres primary + read replica
- Redis cluster
- Failover de filas

## 6. Diagrama de pastas (backend)

```
apps/api/src/
├── main.ts
├── app.module.ts
├── config/
├── common/           # guards, filters, interceptors, pipes, decorators
├── prisma/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── subscriptions/
│   ├── categories/
│   ├── charges/
│   ├── payment-methods/
│   ├── goals/
│   ├── notifications/
│   ├── reports/
│   ├── integrations/
│   │   ├── open-finance/
│   │   ├── gmail/
│   │   ├── google-play/
│   │   ├── apple/
│   │   ├── amazon/
│   │   └── microsoft/
│   ├── detection/
│   ├── ai/
│   ├── audit/
│   └── health/
└── workers/
```

## 7. Diagrama de pastas (frontend)

```
apps/web/src/
├── app/                    # App Router
│   ├── (auth)/
│   ├── (app)/              # shell autenticado
│   │   ├── dashboard/
│   │   ├── subscriptions/
│   │   ├── calendar/
│   │   ├── charges/
│   │   ├── categories/
│   │   ├── reports/
│   │   ├── goals/
│   │   ├── notifications/
│   │   ├── ai/
│   │   ├── integrations/
│   │   ├── profile/
│   │   └── settings/
│   └── api/auth/           # Auth.js
├── components/
│   ├── ui/                 # shadcn
│   ├── layout/
│   ├── subscriptions/
│   ├── dashboard/
│   ├── ai/
│   └── shared/
├── hooks/
├── lib/
├── stores/
└── styles/
```

## 8. Comunicação inter-serviços

- Web → API: REST HTTPS, `Authorization: Bearer <access>` + cookie httpOnly de refresh em fluxo web
- Workers: mesmo código Nest, processo separado `node dist/worker.js`
- Eventos internos: domain events em memória + outbox table para jobs críticos

## 9. Versionamento de API

- Prefixo `/v1`
- Breaking changes: `/v2` com depreciação documentada
- Header `X-Request-Id` em todas as respostas
