# API REST v1 — SubscriptionHub

Base URL: `/v1`  
Formato: JSON  
Auth: `Authorization: Bearer <accessToken>`  
Docs interativas: `/api/docs` (Swagger / OpenAPI 3)

## 1. Convenções

### Sucesso

```json
{
  "data": { },
  "meta": { "requestId": "…", "page": 1, "pageSize": 20, "total": 100 }
}
```

### Erro

```json
{
  "error": {
    "code": "SUBSCRIPTION_NOT_FOUND",
    "message": "Assinatura não encontrada",
    "details": [],
    "requestId": "…"
  }
}
```

### Códigos HTTP

| HTTP | Uso |
|------|-----|
| 200 | OK |
| 201 | Criado |
| 204 | Sem conteúdo |
| 400 | Validação |
| 401 | Não autenticado |
| 403 | Sem permissão / LGPD |
| 404 | Não encontrado |
| 409 | Conflito |
| 422 | Regra de negócio |
| 429 | Rate limit |
| 500 | Erro interno |

### Paginação

Query: `page`, `pageSize` (max 100), `sort`, `order=asc|desc`

## 2. Auth

| Método | Path | Descrição |
|--------|------|-----------|
| POST | `/v1/auth/register` | Registro e-mail |
| POST | `/v1/auth/login` | Login e-mail |
| POST | `/v1/auth/refresh` | Novo access token |
| POST | `/v1/auth/logout` | Revoga refresh |
| POST | `/v1/auth/forgot-password` | Envia e-mail |
| POST | `/v1/auth/reset-password` | Redefine senha |
| POST | `/v1/auth/verify-email` | Confirma e-mail |
| GET | `/v1/auth/oauth/:provider/url` | URL OAuth (google, apple, microsoft) |
| POST | `/v1/auth/oauth/:provider/callback` | Troca code por tokens API |

## 3. Users / Profile

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/v1/me` | Perfil atual |
| PATCH | `/v1/me` | Atualiza perfil |
| POST | `/v1/me/export` | Export LGPD (job) |
| DELETE | `/v1/me` | Exclusão de conta |
| GET | `/v1/me/consents` | Consentimentos |
| POST | `/v1/me/consents` | Registrar consentimento |

## 4. Dashboard

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/v1/dashboard` | Agregados + alertas + resumo IA cacheado |

## 5. Subscriptions

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/v1/subscriptions` | Lista (filtros) |
| POST | `/v1/subscriptions` | Cria manual |
| GET | `/v1/subscriptions/:id` | Detalhe + price history |
| PATCH | `/v1/subscriptions/:id` | Atualiza |
| DELETE | `/v1/subscriptions/:id` | Soft delete |
| POST | `/v1/subscriptions/:id/archive` | Arquiva |
| GET | `/v1/subscriptions/:id/charges` | Cobranças da assinatura |
| GET | `/v1/subscriptions/:id/price-history` | Histórico de preço |

## 6. Categories

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/v1/categories` | Sistema + custom |
| POST | `/v1/categories` | Custom |
| PATCH | `/v1/categories/:id` | Atualiza custom |
| DELETE | `/v1/categories/:id` | Remove custom |

## 7. Charges

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/v1/charges` | Lista / range de datas |
| GET | `/v1/charges/calendar` | Agrupado por dia (mês) |
| PATCH | `/v1/charges/:id` | Status (paid/failed) |

## 8. Payment methods

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/v1/payment-methods` | Lista |
| POST | `/v1/payment-methods` | Cria (últimos 4 dígitos apenas) |
| PATCH | `/v1/payment-methods/:id` | Atualiza |
| DELETE | `/v1/payment-methods/:id` | Remove |

## 9. Detection

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/v1/detection/proposals` | Pendentes |
| POST | `/v1/detection/proposals/:id/confirm` | Confirma |
| POST | `/v1/detection/proposals/:id/reject` | Rejeita |
| POST | `/v1/detection/proposals/:id/merge` | Mescla em assinatura existente |
| POST | `/v1/detection/run` | Reprocessa (rate limited) |

## 10. Integrations

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/v1/integrations` | Status de conexões |
| POST | `/v1/integrations/:type/connect` | Inicia OAuth/consent |
| POST | `/v1/integrations/:type/callback` | Finaliza conexão |
| POST | `/v1/integrations/:type/sync` | Sync manual |
| DELETE | `/v1/integrations/:type` | Desconecta + política de dados |

## 11. AI

| Método | Path | Descrição |
|--------|------|-----------|
| POST | `/v1/ai/chat` | Mensagem ao copiloto |
| GET | `/v1/ai/conversations` | Histórico |
| GET | `/v1/ai/conversations/:id` | Thread |
| GET | `/v1/ai/insights` | Insights atuais |
| POST | `/v1/ai/insights/refresh` | Regenera (rate limit) |

## 12. Reports

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/v1/reports/summary` | Agregado query |
| POST | `/v1/reports/export` | PDF/CSV job |
| GET | `/v1/reports/export/:jobId` | Status / URL |

## 13. Notifications

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/v1/notifications` | Inbox |
| POST | `/v1/notifications/read-all` | Marca lidas |
| PATCH | `/v1/notifications/:id/read` | Marca uma |
| GET | `/v1/notifications/preferences` | Preferências |
| PUT | `/v1/notifications/preferences` | Atualiza |
| POST | `/v1/notifications/devices` | Registra FCM token |

## 14. Goals

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/v1/goals` | Lista |
| POST | `/v1/goals` | Cria |
| PATCH | `/v1/goals/:id` | Atualiza |
| DELETE | `/v1/goals/:id` | Cancela |

## 15. Audit

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/v1/audit-logs` | Próprios logs (paginado) |

## 16. Health

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/health` | Liveness |
| GET | `/health/ready` | Readiness (DB + Redis) |

## 17. Rate limits (padrão)

| Escopo | Limite |
|--------|--------|
| Global IP | 100 req/min |
| Autenticado | 300 req/min |
| Auth login | 10 / 15 min / IP |
| AI chat | 20 / hora |
| Sync integration | 6 / hora / tipo |
| Export | 10 / hora |
