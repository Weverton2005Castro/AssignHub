# Deploy no Render - Backend SubscriptionHub

Este documento descreve como hospedar o backend do SubscriptionHub no Render.

## Pré-requisitos

- Conta no Render (https://render.com)
- Repositório Git do projeto (GitHub, GitLab, ou Bitbucket)
- Contas para serviços externos (opcional):
  - OpenAI (para funcionalidades de IA)
  - Google Cloud (para Gmail OAuth)
  - Supabase (para storage)
  - Pluggy (para Open Finance)

## Configuração

### 1. Arquivos de Configuração

Os seguintes arquivos foram criados para o deploy no Render:

- `render.yaml` - Configuração dos serviços Render
- `apps/api/Dockerfile.render` - Dockerfile para a API
- `apps/api/Dockerfile.worker` - Dockerfile para o worker

### 2. Serviços Configurados

O arquivo `render.yaml` configura os seguintes serviços:

1. **PostgreSQL Database** (`subscriptionhub-postgres`)
   - Banco de dados relacional para armazenamento
   - Plano gratuito (free)

2. **Redis** (`subscriptionhub-redis`)
   - Cache e filas para processamento em background
   - Plano gratuito (free)

3. **API Web Service** (`subscriptionhub-api`)
   - Serviço web principal da API NestJS
   - Health check configurado em `/health/ready`
   - Plano gratuito (free)
   - Executa migrations automaticamente ao iniciar

4. **Background Worker** (`subscriptionhub-worker`)
   - Processamento de tarefas em background (filas BullMQ)
   - Plano gratuito (free)
   - Usa a mesma imagem da API, mas com comando diferente

## Instruções de Deploy

### 1. Fazer push do código para o repositório

Certifique-se de que os arquivos de configuração estão no repositório:

```bash
git add render.yaml apps/api/Dockerfile.render apps/api/Dockerfile.worker
git commit -m "Add Render configuration"
git push
```

### 2. Conectar o repositório ao Render

1. Acesse https://dashboard.render.com
2. Clique em "New +" -> "Web Service"
3. Conecte seu repositório Git
4. Render detectará automaticamente o arquivo `render.yaml`

### 3. Deploy usando Blueprint

1. Na página de criação do serviço, selecione "Blueprints"
2. Render lerá o arquivo `render.yaml` e criará todos os serviços automaticamente
3. Revise as configurações e clique em "Apply Blueprint"

### 4. Configurar variáveis de ambiente adicionais

Após o deploy inicial, você precisará configurar as seguintes variáveis de ambiente no serviço `subscriptionhub-api`:

#### Obrigatórias para produção:

- `OPENAI_API_KEY` - Chave da API da OpenAI
- `SMTP_USER` - Usuário SMTP para envio de e-mails
- `SMTP_PASS` - Senha SMTP
- `SMTP_FROM` - E-mail de origem (ex: "SubscriptionHub <noreply@subscriptionhub.com>")

#### Opcionais (dependendo das funcionalidades):

- `GOOGLE_CLIENT_ID` - Client ID do Google OAuth
- `GOOGLE_CLIENT_SECRET` - Client Secret do Google OAuth
- `PLUGGY_CLIENT_ID` - Client ID do Pluggy (Open Finance)
- `PLUGGY_CLIENT_SECRET` - Client Secret do Pluggy
- `PLUGGY_WEBHOOK_URL` - URL para webhooks do Pluggy
- `MICROSOFT_CLIENT_ID` - Client ID do Microsoft OAuth
- `MICROSOFT_CLIENT_SECRET` - Client Secret do Microsoft OAuth
- `APPLE_CLIENT_ID` - Client ID do Apple OAuth
- `APPLE_CLIENT_SECRET` - Client Secret do Apple OAuth
- `SUPABASE_URL` - URL do Supabase Storage
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key do Supabase
- `SUPABASE_STORAGE_BUCKET` - Nome do bucket no Supabase
- `SENTRY_DSN` - DSN do Sentry para monitoramento
- `OTEL_EXPORTER_OTLP_ENDPOINT` - Endpoint para OpenTelemetry
- `FCM_SERVER_KEY` - Server Key do Firebase Cloud Messaging

### 5. Atualizar CORS para o frontend

Se você também hospedar o frontend no Vercel ou outro serviço, atualize a variável `CORS_ORIGINS` no serviço `subscriptionhub-api`:

```yaml
CORS_ORIGINS=https://seu-frontend.vercel.app,https://seu-dominio.com
```

Também atualize `APP_URL` com a URL do seu frontend.

## Como funciona o deploy

### Pipeline de Deploy

1. **Build**: Render constrói a imagem Docker usando o `Dockerfile.render`
2. **Migrations**: A API executa `prisma migrate deploy` automaticamente ao iniciar
3. **Health Check**: Render verifica o endpoint `/health/ready` para garantir que a API está funcionando
4. **Worker**: O worker inicia separadamente, conectando-se ao mesmo banco e Redis

### Estrutura do Dockerfile

O Dockerfile usa multi-stage build:

1. **Base**: Configura Node.js 22 e pnpm
2. **Deps**: Instala apenas as dependências
3. **Build**: Compila o TypeScript e gera o Prisma Client
4. **Runner**: Imagem final leve com apenas o necessário

## URLs após o deploy

Após o deploy, seus serviços estarão disponíveis em:

- API: `https://subscriptionhub-api.onrender.com`
- Health Check: `https://subscriptionhub-api.onrender.com/health/ready`
- OpenAPI Docs: `https://subscriptionhub-api.onrender.com/api/docs`

## Monitoramento

### Logs

- Acesse os logs na dashboard do Render
- Use a estrutura JSON do Pino para facilitar a leitura
- Configure Sentry para monitoramento de erros

### Health Checks

- Render verifica automaticamente o endpoint `/health/ready`
- O endpoint verifica conexão com PostgreSQL e Redis
- Se o health check falhar, Render reinicia o serviço

## Troubleshooting

### Build falha

- Verifique se o `pnpm-lock.yaml` está atualizado
- Certifique-se de que todas as dependências estão instaladas localmente
- Verifique os logs de build na dashboard do Render

### API não inicia

- Verifique as variáveis de ambiente
- Confirme que o PostgreSQL e Redis estão funcionando
- Verifique os logs para erros de conexão

### Migrations falham

- Verifique a conexão com o banco de dados
- Confirme que a variável `DATABASE_URL` está correta
- Verifique os logs do Prisma

### Worker não processa filas

- Verifique a conexão com Redis
- Confirme que as variáveis de ambiente do worker estão iguais às da API
- Verifique os logs do worker

## Custos

Com a configuração atual (plano gratuito):

- PostgreSQL: Gratuito (até 90 dias, depois $7/mês)
- Redis: Gratuito (até 90 dias, depois $15/mês)
- API Web Service: Gratuito (com limites)
- Worker: Gratuito (com limites)

## Limitações do plano gratuito

- 512MB RAM por serviço
- CPU compartilhada
- Timeout de conexão (web services dormem após 15min inatividade)
- 100GB de tráfego/mês
- 500 builds/mês

Para produção, considere atualizar para planos pagos.

## Próximos passos

1. Configure as variáveis de ambiente obrigatórias
2. Teste a API usando os endpoints
3. Configure o monitoramento (Sentry)
4. Configure o domínio personalizado (opcional)
5. Atualize o frontend para usar a URL da API
6. Configure CI/CD (GitHub Actions) para deploy automático

## Referências

- [Render Documentation](https://render.com/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Docker Documentation](https://docs.docker.com)
