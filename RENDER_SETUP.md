# Deploy no Render - Backend SubscriptionHub

Este documento descreve como hospedar o backend do SubscriptionHub (NestJS) no Render.

## Pré-requisitos

- Conta no Render (https://render.com)
- Repositório Git do projeto (GitHub, GitLab, ou Bitbucket)
- Conta no Supabase (para banco de dados PostgreSQL)
- Contas para serviços externos (opcional):
  - OpenAI (para funcionalidades de IA)
  - Google Cloud (para Gmail OAuth)
  - Apple Developer Program (para Apple OAuth)
  - Microsoft Azure (para Microsoft OAuth)

## Configuração do Banco de Dados

### 1. Criar projeto no Supabase

1. Acesse https://supabase.com
2. Crie um novo projeto
3. Aguarde o projeto ser provisionado
4. Vá em Settings > Database para obter as strings de conexão

### 2. Obter strings de conexão

No painel do Supabase, você precisará de duas strings de conexão:

- **DATABASE_URL**: Use a string de conexão do **Transaction Pooler** (recomendado para produção)
  - Formato: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres`
  
- **DIRECT_URL**: Use a string de conexão direta (para migrations)
  - Formato: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

**Importante**: Use o pooler (porta 6543) para `DATABASE_URL` em produção para melhor performance.

## Instruções de Deploy

### 1. Conectar o repositório ao Render

1. Acesse https://dashboard.render.com
2. Clique em "New +" -> "Web Service"
3. Conecte seu repositório Git (o projeto `Weverton2005Castro/AssignHub`)

### 2. Configurar o Web Service

Configure o serviço com as seguintes especificações:

#### Basic Settings
- **Name**: `subscriptionhub-api` (ou outro nome de sua preferência)
- **Region**: Escolha a região mais próxima dos seus usuários
- **Branch**: `main` (ou sua branch de produção)

#### Build & Deploy Settings
- **Runtime**: `Node`
- **Build Command**: `cd backend && npm install && npm run build`
- **Start Command**: `cd backend && npm run start:prod`

#### Advanced Settings
- **Root Directory**: `backend`
- **Instance Type**: `Free` (ou plano pago para produção)

### 3. Configurar variáveis de ambiente

Adicione as seguintes variáveis de ambiente na seção "Environment Variables":

#### Obrigatórias

```bash
# Database (Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Server
PORT=4000
NODE_ENV=production

# JWT (gerar chaves seguras)
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# Encryption (64 caracteres hexadecimais)
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# CORS (URL do seu frontend)
CORS_ORIGINS=https://seu-frontend.vercel.app
```

#### Opcionais (dependendo das funcionalidades)

```bash
# OAuth - Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://subscriptionhub-api.onrender.com/auth/google/callback

# OAuth - Apple
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=your-apple-private-key-content

# OAuth - Microsoft
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=common
MICROSOFT_CALLBACK_URL=https://subscriptionhub-api.onrender.com/auth/microsoft/callback

# Email (SMTP)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=your-api-key
SMTP_FROM=noreply@yourdomain.com

# OpenAI (AI Assistant)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini

# App URLs
APP_URL=https://seu-frontend.vercel.app
API_URL=https://subscriptionhub-api.onrender.com

# Rate Limiting
THROTTLE_TTL_MS=60000
THROTTLE_LIMIT=100
```

### 4. Executar migrations no primeiro deploy

As migrations do Prisma são executadas automaticamente pelo comando `start:prod` configurado no `package.json`. Este comando:

1. Executa `prisma migrate deploy` para aplicar as migrations pendentes
2. Inicia a aplicação com `node dist/main.js`

Se você precisar executar migrations manualmente, acesse o serviço no Render e use o Shell:

```bash
cd backend && npx prisma migrate deploy
```

### 5. Health Check

Configure o health check para garantir que a API está funcionando:

- **Health Check Path**: `/health/ready`
- **Health Check Timeout**: 30s
- **Auto-deploy**: Ativado (deploy automático quando há push no branch configurado)

## URLs após o deploy

Após o deploy, seu serviço estará disponível em:

- API: `https://subscriptionhub-api.onrender.com`
- Health Check: `https://subscriptionhub-api.onrender.com/health/ready`
- OpenAPI Docs: `https://subscriptionhub-api.onrender.com/api/docs`

## Atualizar Frontend

Após obter a URL da API no Render:

1. Vá ao projeto do frontend na Vercel
2. Acesse Settings > Environment Variables
3. Atualize `NEXT_PUBLIC_API_URL` com a URL do backend (ex: `https://subscriptionhub-api.onrender.com`)
4. Redeploy o frontend

## Monitoramento

### Logs

- Acesse os logs na dashboard do Render
- A API usa `nestjs-pino` para logs estruturados em JSON
- Configure Sentry para monitoramento de erros (opcional)

### Health Checks

- Render verifica automaticamente o endpoint `/health/ready`
- Se o health check falhar, Render reinicia o serviço automaticamente

## Troubleshooting

### Build falha

- Verifique se o `package-lock.json` está atualizado
- Certifique-se de que o Node.js está na versão correta (>=22)
- Verifique os logs de build na dashboard do Render

### API não inicia

- Verifique todas as variáveis de ambiente obrigatórias
- Confirme que as strings de conexão do Supabase estão corretas
- Verifique os logs para erros de conexão com o banco

### Migrations falham

- Verifique se `DATABASE_URL` e `DIRECT_URL` estão configuradas corretamente
- Confirme que o banco de dados Supabase está acessível
- Verifique os logs do Prisma no terminal ou nos logs do Render

### Erro de CORS

- Verifique se `CORS_ORIGINS` inclui a URL do seu frontend
- Para testes locais, adicione `http://localhost:3000` à lista

### Erro de conexão com banco

- Use a string do pooler (porta 6543) para `DATABASE_URL`
- Use a string direta (porta 5432) para `DIRECT_URL`
- Verifique as configurações de rede no Supabase

## Custos

Com o plano gratuito do Render:

- **Web Service**: Gratuito (com limites)
- **Supabase**: Plano gratuito disponível (até 500MB de banco)

## Limitações do plano gratuito Render

- 512MB RAM
- CPU compartilhada
- Web services dormem após 15min de inatividade (cold start)
- 100GB de tráfego/mês
- 750 horas/mês

Para produção, considere:
- Plano pago do Render ($7/mês ou mais)
- Plano pago do Supabase ($25/mês ou mais)

## Próximos passos

1. Configure todas as variáveis de ambiente obrigatórias
2. Execute as migrations do Prisma
3. Teste a API usando os endpoints
4. Configure o monitoramento (Sentry, opcional)
5. Configure domínio personalizado (opcional)
6. Atualize o frontend para usar a URL da API
7. Configure CI/CD (GitHub Actions) para deploy automático

## Segurança

- Nunca commitar arquivos `.env` com segredos reais
- Use valores diferentes para produção e desenvolvimento
- Use chaves fortes para JWT e ENCRYPTION_KEY
- Configure CORS corretamente para permitir apenas origens confiáveis
- Use HTTPS em produção (Render fornece automaticamente)

## Referências

- [Render Documentation](https://render.com/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
