# Infraestrutura, CI/CD e monitoramento

## 1. Ambientes

| Env | Web | API | DB |
|-----|-----|-----|-----|
| local | :3000 | :4000 | Docker Postgres/Redis |
| staging | Vercel preview | Railway staging | Managed Postgres |
| production | Vercel | Railway/Render | Managed Postgres + Redis |

## 2. Docker Compose (local)

Serviços: `postgres`, `redis`, `api`, `worker`, `web` (opcional), `mailpit` (e-mails dev)

## 3. CI (GitHub Actions)

Pipeline em todo PR:

1. Lint + typecheck
2. Unit tests
3. Build api + web
4. Integration tests com Postgres service container
5. E2E Playwright (smoke) em preview opcional
6. `pnpm audit` (high+)

Main:

1. Build images
2. Migrate (job release)
3. Deploy API
4. Deploy Web
5. Sentry release

## 4. Deploy

### Web (Vercel)

- Root: `apps/web`
- Env: `NEXT_PUBLIC_API_URL`, Auth.js secrets, OAuth clients

### API (Railway/Render)

- Dockerfile `apps/api`
- Health check `/health/ready`
- Scale horizontal 2+ em produção
- Worker como processo separado mesma imagem, comando diferente

## 5. Observabilidade

- **Sentry**: browser + node (API/worker)
- **OpenTelemetry**: traces HTTP + Prisma + BullMQ
- **Logs**: JSON estruturado (pino), `requestId` correlacionado
- **Métricas**: latência, fila depth, AI token usage, sync failures

## 6. Backups

- Postgres: daily automated + PITR se provedor permitir
- Teste de restore trimestral
- Redis: efêmero (não fonte da verdade)

## 7. Secrets

- GitHub Environments
- Nunca commitar `.env`
- Rotação de `JWT_SECRET` e `ENCRYPTION_KEY` com dual-key window
