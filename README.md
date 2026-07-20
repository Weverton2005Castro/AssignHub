# SubscriptionHub

**Copiloto Financeiro Pessoal** — descubra, organize, monitore e analise assinaturas e gastos recorrentes com Inteligência Artificial.

SubscriptionHub não é apenas um gerenciador de assinaturas. É um sistema inteligente que interpreta dados financeiros, prevê cobranças, identifica desperdícios e ajuda o usuário a tomar decisões.

## Visão do produto

O usuário nunca mais precisa lembrar quais serviços paga. O sistema:

- Descobre assinaturas automaticamente (Open Finance, e-mail, lojas digitais)
- Detecta cobranças recorrentes e aprende padrões
- Organiza tudo em um único lugar
- Prevê cobranças futuras e alertas inteligentes
- Identifica desperdícios, duplicidades e aumentos de preço
- Responde perguntas em linguagem natural via IA
- Gera relatórios e acompanha a evolução dos gastos

## Stack tecnológica

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind, shadcn/ui, Framer Motion, React Query, Zustand | SSR/SSG, tipagem, DX, estado servidor/cliente |
| Backend | NestJS, TypeScript, Prisma, REST | Modularidade, DI, validação, OpenAPI nativo |
| Banco | PostgreSQL (Supabase) | Relacional, ACID, JSONB, full-text, gerenciado |
| Storage | Supabase Storage | Logos, PDFs de relatórios, anexos de e-mail |
| Auth | Auth.js (NextAuth) + JWT/Refresh no API | OAuth social + e-mail, tokens de API seguros |
| IA | OpenAI (function calling + embeddings) | Q&A, RAG, classificação, insights |
| Deploy | Vercel (frontend), Render (backend) | Serverless, fácil deploy, escalável |

## Estrutura do projeto

```
subscriptionhub/
├── frontend/                # Next.js (Vercel)
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── stores/         # Zustand stores
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utilities
│   └── package.json
├── backend/                 # NestJS (Render)
│   ├── src/
│   │   ├── common/         # Shared utilities
│   │   ├── modules/        # Feature modules
│   │   └── prisma/         # Prisma client
│   └── package.json
├── docs/                    # Documentação
└── README.md
```

## Início rápido

### Pré-requisitos

- Node.js 22+
- npm
- Conta Supabase
- Contas: OpenAI, Google Cloud (OAuth/Gmail) - opcionais

### Desenvolvimento local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar Supabase
# Crie um projeto em https://supabase.com
# Copie as connection strings para .env

# 3. Configurar variáveis de ambiente
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 4. Migrar e seed do banco
cd backend
npm run db:generate
npm run db:migrate
npm run db:seed

# 5. Subir API e Web (em terminais separados)
npm run dev:backend  # Terminal 1
npm run dev:frontend # Terminal 2
```

- Web: http://localhost:3000  
- API: http://localhost:4000  
- OpenAPI: http://localhost:4000/api  

## Documentação

| Documento | Conteúdo |
|-----------|----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitetura, diagramas, decisões |
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | RF, RNF, casos de uso |
| [docs/DATABASE.md](docs/DATABASE.md) | Modelo ER, índices, constraints |
| [docs/API.md](docs/API.md) | Endpoints, erros, autenticação |
| [docs/FRONTEND.md](docs/FRONTEND.md) | Telas, fluxos, estados UX |
| [docs/SECURITY.md](docs/SECURITY.md) | OWASP, LGPD, Open Finance |
| [docs/AI.md](docs/AI.md) | Copiloto, function calling, RAG |
| [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md) | Deploy, CI/CD, monitoramento |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Roadmap e backlog priorizado |
| [docs/TESTING.md](docs/TESTING.md) | Estratégia de testes |
| [docs/CONVENTIONS.md](docs/CONVENTIONS.md) | Padrões de código |

## Princípios de design de interface

- Minimalista, limpa, profissional (referência: Linear, Notion, Stripe, Vercel)
- Sem emojis e sem decoração artificial
- Poucas cores; hierarquia por tipografia e espaçamento
- Acessibilidade (WCAG 2.1 AA)
- Mobile-first com layouts desktop densos e legíveis

## Licença

Proprietary — todos os direitos reservados.
