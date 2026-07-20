# Configuração de Variáveis de Ambiente na Vercel

## Variáveis necessárias para o frontend (Next.js)

Configure estas variáveis no painel da Vercel (Settings > Environment Variables):

### Variáveis obrigatórias
- `NEXT_PUBLIC_API_URL`: URL da API (ex: `https://api.seusite.com`)
- `NEXTAUTH_URL`: URL do site (ex: `https://seusite.vercel.app`)
- `NEXTAUTH_SECRET`: Segredo do NextAuth (gera com: `openssl rand -base64 32`)

### Variáveis de autenticação OAuth (opcional)
- `GOOGLE_CLIENT_ID`: ID do cliente Google OAuth
- `GOOGLE_CLIENT_SECRET`: Secret do cliente Google OAuth
- `APPLE_CLIENT_ID`: ID do cliente Apple OAuth
- `APPLE_CLIENT_SECRET`: Secret do cliente Apple OAuth
- `MICROSOFT_CLIENT_ID`: ID do cliente Microsoft OAuth
- `MICROSOFT_CLIENT_SECRET`: Secret do cliente Microsoft OAuth

## Passos para configurar

1. Acesse https://vercel.com/dashboard
2. Clique em "Add New Project"
3. Importe o repositório do GitHub
4. Configure as variáveis de ambiente em "Environment Variables"
5. Clique em "Deploy"

## Deploy da API

A API (NestJS) deve ser hospedada em um serviço diferente (Railway, Render, etc).
Configure a URL da API em `NEXT_PUBLIC_API_URL` no frontend.

## Observações

- Para desenvolvimento local, use os arquivos `.env.example` como referência
- Nunca commitar arquivos `.env` com segredos reais
- Use valores diferentes para produção e desenvolvimento