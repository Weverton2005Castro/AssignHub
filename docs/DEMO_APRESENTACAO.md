# Roteiro de apresentação — SubscriptionHub

## Link para sócios (mesma Wi‑Fi)

**http://172.25.26.21:3000**

Login:

- E-mail: `demo@subscriptionhub.local`
- Senha: `Demo1234!`

## Fluxo sugerido (8–10 min)

1. **Landing** (`/`) — problema: ninguém lembra o que paga  
2. **Login** com usuário demo  
3. **Dashboard** — totais mensal/anual, resumo do copiloto, insights, economia  
4. **Assinaturas** — lista real (Netflix, Spotify, ChatGPT, iCloud, GitHub)  
5. **Detecções** — YouTube Premium pendente (Open Finance demo) → Confirmar  
6. **Integrações** — OAuth Gmail real / Pluggy Open Finance / recibos de loja via e-mail (sem mock)  
7. **Copiloto** — perguntas:  
   - “Quanto gasto com streaming?”  
   - “Qual assinatura mais cara?”  
   - “O que posso cancelar?”  
8. **Calendário / Relatórios** — visão de cobranças e export  
9. **Configurações → Privacidade** — LGPD export/exclusão  

## Mensagem de produto

> Não é um gerenciador de assinaturas. É um copiloto que descobre, interpreta e ajuda a decidir.

## Requisitos técnicos para a demo

- Máquina host ligada e processos API/Web rodando  
- Sócios na **mesma rede Wi‑Fi**  
- Se o IP mudar, atualizar `apps/web/.env.local` (`NEXT_PUBLIC_API_URL`) e reiniciar o Next  
