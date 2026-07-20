# Integrações reais — setup

Mocks foram removidos. Cada fonte exige credenciais e/ou Gmail.

## 1. Gmail (obrigatório para lojas)

1. Google Cloud Console → projeto → OAuth Client (Web)
2. Redirect URI:
   ```
   http://SEU_IP:4000/api/v1/integrations/GMAIL/oauth/callback
   ```
   Em produção use HTTPS.
3. Ative **Gmail API**
4. No `apps/api/.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   API_URL=http://SEU_IP:4000
   APP_URL=http://SEU_IP:3000
   ```

## 2. Open Finance (Pluggy)

1. Crie conta em https://pluggy.ai (sandbox ou production)
2. Copie Client ID / Secret
3. Env:
   ```
   PLUGGY_CLIENT_ID=...
   PLUGGY_CLIENT_SECRET=...
   PLUGGY_API_URL=https://api.pluggy.ai
   ```
4. No app: Integrações → Open Finance → widget Pluggy → banco real/sandbox Pluggy
5. Sincronizar importa **transações reais** e roda o motor de detecção

## 3. Google Play / Apple / Amazon

Não existe API pública de “minhas assinaturas” do consumidor.

Fluxo real no produto:

1. Conectar Gmail
2. Conectar a loja (vincula à mesma caixa)
3. Sync busca e-mails reais de recibo daquela loja e extrai valor/merchant

## 4. Microsoft

Opção A — Graph:

```
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_TENANT=common
```

Redirect:

```
http://SEU_IP:4000/api/v1/integrations/MICROSOFT/oauth/callback
```

Opção B — sem Graph: usa recibos via Gmail (mesmo padrão das lojas).

## 5. Reiniciar API após env

```bash
# rebuild + restart API
cd apps/api && node dist/main.js
```

## Checklist de demo com dados reais

- [ ] Gmail conectado com conta que recebe Netflix/Spotify/etc.
- [ ] Sync Gmail → Detecções com propostas baseadas em e-mails verdadeiros
- [ ] Pluggy com banco sandbox ou produção → Open Finance sync
- [ ] Lojas após Gmail → recibos filtrados por remetente
