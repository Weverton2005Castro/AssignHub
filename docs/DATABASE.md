# Modelo de dados — SubscriptionHub

## 1. Princípios

- Isolamento por `userId` em todas as tabelas de tenant
- Soft delete onde houver valor de auditoria (`deletedAt`)
- Valores monetários em **centavos** (`Int`/`BigInt`) + `currency` ISO 4217
- Timestamps `createdAt`/`updatedAt` em UTC
- IDs: UUID v7 (ordenáveis) via Prisma `@default(uuid())` + geração app-level quando necessário
- JSONB para metadados de integração e payloads de IA (versionados)

## 2. Diagrama ER (resumo textual)

```
User 1──* Account (OAuth providers)
User 1──* Session / RefreshToken
User 1──* Consent
User 1──* Category (custom) + System Category
User 1──* PaymentMethod
User 1──* Subscription *──1 Category
Subscription 1──* PriceHistory
Subscription 1──* Charge
Subscription *──1 PaymentMethod?
User 1──* IntegrationConnection 1──* RawEvent
RawEvent *──? DetectionProposal *──? Subscription
User 1──* Notification
User 1──* Goal
User 1──* AiConversation 1──* AiMessage
User 1──* ReportJob
User 1──* AuditLog
User 1──* MerchantAlias (aprendizado)
User 1──* DailySpendStat (agregado)
```

## 3. Enums principais

- `AuthProvider`: EMAIL, GOOGLE, APPLE, MICROSOFT
- `SubscriptionStatus`: ACTIVE, PAUSED, CANCELLED, TRIAL, EXPIRED, UNKNOWN
- `BillingPeriod`: WEEKLY, MONTHLY, QUARTERLY, SEMIANNUAL, YEARLY, CUSTOM
- `SubscriptionSource`: MANUAL, OPEN_FINANCE, EMAIL, GOOGLE_PLAY, APPLE, AMAZON, MICROSOFT
- `ChargeStatus`: SCHEDULED, PAID, FAILED, SKIPPED, REFUNDED
- `PaymentMethodType`: CREDIT_CARD, DEBIT_CARD, PIX, BANK_ACCOUNT, DIGITAL_WALLET, OTHER
- `IntegrationType`: OPEN_FINANCE, GMAIL, GOOGLE_PLAY, APPLE, AMAZON, MICROSOFT
- `IntegrationStatus`: CONNECTED, DISCONNECTED, ERROR, PENDING, EXPIRED
- `ProposalStatus`: PENDING, CONFIRMED, REJECTED, MERGED
- `NotificationChannel`: IN_APP, EMAIL, PUSH
- `NotificationType`: CHARGE_TOMORROW, CHARGE_TODAY, TRIAL_ENDING, PRICE_INCREASE, NEW_SUBSCRIPTION, DUPLICATE, SAVINGS, PAYMENT_FAILED, SYSTEM
- `GoalType`: SAVE_AMOUNT, CANCEL_COUNT, REDUCE_CATEGORY
- `GoalStatus`: ACTIVE, COMPLETED, CANCELLED
- `AuditAction`: LOGIN, LOGOUT, CREATE, UPDATE, DELETE, EXPORT, SYNC, CONSENT, AI_QUERY, …

## 4. Índices críticos

| Tabela | Índice | Motivo |
|--------|--------|--------|
| subscriptions | (userId, status) | Listagens filtradas |
| subscriptions | (userId, nextBillingDate) | Calendário e alertas |
| subscriptions | GIN full-text name/company | Busca |
| charges | (userId, dueDate) | Calendário |
| charges | (subscriptionId, dueDate) | Histórico por assinatura |
| raw_events | (userId, source, occurredAt) | Sync e detecção |
| raw_events | (userId, fingerprint) UNIQUE | Idempotência de ingestão |
| detection_proposals | (userId, status) | Inbox de confirmação |
| audit_logs | (userId, createdAt) | Trilha temporal |
| notifications | (userId, readAt, createdAt) | Inbox |
| merchant_aliases | (userId, normalizedAlias) | Lookup de aprendizado |
| daily_spend_stats | (userId, date) UNIQUE | Dashboard rápido |
| refresh_tokens | (tokenHash) | Validação O(1) |

## 5. Segurança de dados

- Tokens OAuth e Open Finance: **AES-256-GCM** em repouso (`encryptedPayload`)
- Refresh tokens: apenas **hash** (SHA-256) armazenado
- Senhas: **Argon2id**
- Campos sensíveis em logs: redaction middleware
- Soft-delete + hard-delete job pós-solicitação LGPD (prazo configurável)

## 6. Agregados e performance

Tabela `daily_spend_stats`:

- `totalCents`, `byCategory` (JSONB), `activeSubscriptions`
- Atualizada por worker após mudanças em charges/subscriptions
- Dashboard lê agregado; fallback recalcula se ausente

## 7. Seed

- Categorias do sistema (16)
- Usuário demo (apenas non-prod)
- Assinaturas e cobranças de exemplo
