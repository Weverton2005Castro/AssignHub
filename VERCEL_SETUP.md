# Passo a Passo para Deploy na Vercel

## 1. Deploy do Frontend (Next.js) na Vercel

### 1.1. Preparar o repositório
Certifique-se de que o arquivo `frontend/vercel.json` existe e está configurado.

### 1.2. Criar projeto na Vercel
1. Acesse https://vercel.com/dashboard
2. Clique em "Add New Project"
3. Importe o repositório do GitHub: `Weverton2005Castro/AssignHub`
4. Configure o projeto:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### 1.3. Configurar variáveis de ambiente
No painel da Vercel (Settings > Environment Variables), adicione:

#### Variáveis obrigatórias
- `NEXT_PUBLIC_API_URL`: URL da API backend (ex: `https://api.seusite.com`)
- `NEXTAUTH_URL`: URL do site (ex: `https://seusite.vercel.app`)
- `NEXTAUTH_SECRET`: Segredo do NextAuth (gera com: `openssl rand -base64 32`)

#### Variáveis de autenticação OAuth (opcional)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: ID do cliente Google OAuth
- `NEXT_PUBLIC_APPLE_CLIENT_ID`: ID do cliente Apple OAuth
- `NEXT_PUBLIC_MICROSOFT_CLIENT_ID`: ID do cliente Microsoft OAuth

### 1.4. Deploy
1. Clique em "Deploy"
2. Aguarde o build e deploy
3. A URL do projeto será gerada automaticamente

## 2. Deploy do Backend (NestJS) em Serviço Alternativo

### 2.1. Opções de hospedagem
Recomendamos usar um dos seguintes serviços:
- **Railway** (recomendado)
- **Render**
- **Fly.io**
- **DigitalOcean App Platform**

### 2.2. Exemplo: Deploy no Railway
1. Acesse https://railway.app
2. Clique em "New Project"
3. Importe o repositório do GitHub
4. Configure o projeto:
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`

### 2.3. Variáveis de ambiente no Railway
Adicione as seguintes variáveis no Railway:

#### Variáveis do banco Supabase
- `DATABASE_URL`: String de conexão do pooler Supabase
- `DIRECT_URL`: String de conexão direta (opcional)

#### Variáveis do servidor
- `PORT`: 4000
- `NODE_ENV`: production

#### Variáveis de autenticação
- `JWT_ACCESS_SECRET`: Segredo para tokens de acesso (mínimo 32 caracteres)
- `JWT_REFRESH_SECRET`: Segredo para tokens de refresh (mínimo 32 caracteres)
- `ENCRYPTION_KEY`: Chave de criptografia (64 caracteres hexadecimais)

#### Variáveis de CORS
- `CORS_ORIGINS`: URLs permitidas (ex: `https://seusite.vercel.app`)

#### Variáveis de OAuth (opcional)
- `GOOGLE_CLIENT_ID`: ID do cliente Google OAuth
- `GOOGLE_CLIENT_SECRET`: Secret do cliente Google OAuth
- `GOOGLE_CALLBACK_URL`: URL de callback (ex: `https://api.seusite.com/auth/google/callback`)
- `APPLE_CLIENT_ID`: ID do cliente Apple OAuth
- `APPLE_TEAM_ID`: Team ID da Apple
- `APPLE_KEY_ID`: Key ID da Apple
- `APPLE_PRIVATE_KEY`: Chave privada da Apple
- `MICROSOFT_CLIENT_ID`: ID do cliente Microsoft OAuth
- `MICROSOFT_CLIENT_SECRET`: Secret do cliente Microsoft OAuth
- `MICROSOFT_TENANT_ID`: Tenant ID (geralmente `common`)
- `MICROSOFT_CALLBACK_URL`: URL de callback

#### Variáveis de email (opcional)
- `SMTP_HOST`: Host SMTP (ex: `smtp.resend.com`)
- `SMTP_PORT`: Porta SMTP (ex: `587`)
- `SMTP_USER`: Usuário SMTP
- `SMTP_PASSWORD`: Senha SMTP
- `SMTP_FROM`: Email de origem (ex: `noreply@seusite.com`)

#### Variáveis de OpenAI (opcional)
- `OPENAI_API_KEY`: Chave da API OpenAI
- `OPENAI_MODEL`: Modelo (ex: `gpt-4o-mini`)

### 2.4. Deploy do banco de dados
1. No Railway, após configurar as variáveis de ambiente
2. Rode o comando de migração: `npm run db:migrate:deploy`
3. Ou configure para rodar automaticamente no deploy

### 2.5. Obter URL da API
Após o deploy, o Railway fornecerá uma URL para sua API (ex: `https://api.seusite.railway.app`)

## 3. Atualizar Frontend com URL da API

1. Vá ao projeto na Vercel
2. Acesse Settings > Environment Variables
3. Atualize `NEXT_PUBLIC_API_URL` com a URL do backend deployado
4. Redeploy o frontend

## 4. Verificar Deploy

1. Acesse a URL do frontend na Vercel
2. Verifique se a aplicação está funcionando
3. Teste a autenticação e funcionalidades principais

## Observações Importantes

- **Nunca commitar arquivos `.env`** com segredos reais
- **Use valores diferentes** para produção e desenvolvimento
- **Configure CORS corretamente** no backend para permitir acesso do frontend
- **Use HTTPS** em produção
- **Configure rate limiting** para proteger sua API
- **Monitore logs** para identificar problemas

## Solução de Problemas

### Erro de CORS
Verifique se `CORS_ORIGINS` no backend inclui a URL do frontend.

### Erro de conexão com banco
Verifique se `DATABASE_URL` está configurada corretamente com o pooler do Supabase.

### Erro de build
Verifique se todas as dependências estão instaladas e se o build command está correto.

### Erro de autenticação
Verifique se `NEXTAUTH_SECRET` e `NEXTAUTH_URL` estão configurados corretamente.