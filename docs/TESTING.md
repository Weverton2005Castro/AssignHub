# Estratégia de testes

## Pirâmide

1. **Unit** (70%): services, detection matching, money utils, AI tool routing
2. **Integration** (20%): Prisma + HTTP modules Nest com DB de teste
3. **E2E** (10%): Playwright fluxos críticos web

## Backend

- Jest + supertest
- Testcontainers ou service Postgres no CI
- Factories para User/Subscription

## Frontend

- Vitest + Testing Library para componentes
- Playwright: login, criar assinatura, confirmar detecção, chat AI (mock API)

## Contratos

- OpenAPI lint
- Shared Zod schemas usados em api e web

## Qualidade de IA

- Golden questions com tools mockadas
- Assert estrutura da resposta e chamadas de tool
