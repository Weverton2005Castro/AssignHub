# Convenções de código

## Geral

- TypeScript strict
- pt-BR para copy de UI; inglês para código (variáveis, commits)
- Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`

## Naming

- React components: PascalCase
- Hooks: `useXxx`
- Nest modules: kebab-case folders
- DB: snake_case via Prisma `@@map`

## API

- DTOs com class-validator + OpenAPI decorators
- Services sem HTTP; Controllers finos
- Nunca confiar em `userId` do body — sempre do token

## Frontend

- Server Components default; Client só quando necessário
- Dados remotos via React Query em client components
- shadcn/ui sem fork desnecessário

## Git

- Branch: `feat/…`, `fix/…`
- PR pequeno quando possível; monorepo permite paths filter no CI
