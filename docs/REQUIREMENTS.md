# Requisitos — SubscriptionHub

## 1. Requisitos funcionais

### RF-AUTH — Autenticação e conta

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-AUTH-01 | Registro e login por e-mail/senha | P0 |
| RF-AUTH-02 | Login Google OAuth 2.0 | P0 |
| RF-AUTH-03 | Login Apple | P1 |
| RF-AUTH-04 | Login Microsoft | P1 |
| RF-AUTH-05 | Verificação de e-mail | P0 |
| RF-AUTH-06 | Recuperação de senha | P0 |
| RF-AUTH-07 | Logout e revogação de refresh tokens | P0 |
| RF-AUTH-08 | Aceite de termos e política de privacidade (LGPD) | P0 |
| RF-AUTH-09 | Exclusão de conta e exportação de dados (portabilidade) | P0 |

### RF-SUB — Assinaturas

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-SUB-01 | CRUD de assinaturas manuais | P0 |
| RF-SUB-02 | Campos: nome, categoria, empresa, logo, valor, moeda, periodicidade, data de cobrança, renovação automática, método de pagamento, plano, observações, site, status, fonte | P0 |
| RF-SUB-03 | Histórico de alteração de preço | P0 |
| RF-SUB-04 | Filtros: status, categoria, fonte, faixa de valor | P0 |
| RF-SUB-05 | Busca full-text por nome/empresa | P0 |
| RF-SUB-06 | Soft delete e arquivamento | P0 |
| RF-SUB-07 | Marcar como “esquecida / sem uso” | P1 |
| RF-SUB-08 | Cancelamento assistido (checklist + link) | P1 |

### RF-CAT — Categorias

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-CAT-01 | Categorias padrão do sistema (Streaming, Jogos, IA, Cloud, …) | P0 |
| RF-CAT-02 | Categoria customizada do usuário | P1 |
| RF-CAT-03 | Reclassificação em lote | P1 |

### RF-CHG — Cobranças e calendário

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-CHG-01 | Lista de cobranças passadas e futuras | P0 |
| RF-CHG-02 | Calendário mensal de cobranças | P0 |
| RF-CHG-03 | Registro de pagamento / falha | P1 |
| RF-CHG-04 | Previsão de próximas N cobranças por assinatura | P0 |

### RF-DET — Motor de detecção

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-DET-01 | Ingestão de eventos de múltiplas fontes | P0 |
| RF-DET-02 | Normalização de merchant e valor | P0 |
| RF-DET-03 | Detecção de recorrência (mesmo valor/período/estabelecimento) | P0 |
| RF-DET-04 | Proposta com score e confirmação do usuário | P0 |
| RF-DET-05 | Aprendizado permanente de aliases e padrões | P0 |
| RF-DET-06 | Detecção de duplicidade de serviço | P1 |

### RF-INT — Integrações

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-INT-01 | Open Finance: consentimento, importação, sync | P0 |
| RF-INT-02 | Gmail: OAuth, busca de invoices/receipts | P0 |
| RF-INT-03 | Google Play / Apple / Amazon / Microsoft (APIs ou e-mail fallback) | P1–P2 |
| RF-INT-04 | Revogação de conexão e exclusão de dados derivados | P0 |
| RF-INT-05 | Última sincronização e status por integração | P0 |

### RF-AI — Inteligência artificial

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-AI-01 | Chat copiloto com function calling | P0 |
| RF-AI-02 | Insights automáticos no dashboard | P0 |
| RF-AI-03 | Desperdícios, redundâncias, aumentos de preço | P0 |
| RF-AI-04 | Previsões de gasto (7 dias, mês, ano) | P0 |
| RF-AI-05 | Resumo gerado periodicamente | P0 |
| RF-AI-06 | Rate limit e orçamento de tokens por usuário | P0 |

### RF-REP — Relatórios

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-REP-01 | Relatório mensal e anual | P0 |
| RF-REP-02 | Por categoria e empresa | P0 |
| RF-REP-03 | Comparativos período a período | P1 |
| RF-REP-04 | Export PDF e CSV | P0 |

### RF-NOT — Notificações

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-NOT-01 | Cobrança amanhã / hoje | P0 |
| RF-NOT-02 | Trial terminando | P1 |
| RF-NOT-03 | Aumento de preço / nova assinatura / duplicidade | P0 |
| RF-NOT-04 | Economia possível / pagamento recusado | P1 |
| RF-NOT-05 | Preferências por canal (e-mail, push, in-app) | P0 |

### RF-GOAL — Metas

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-GOAL-01 | Meta de economia em valor | P1 |
| RF-GOAL-02 | Meta de cancelar N assinaturas | P1 |
| RF-GOAL-03 | Meta de reduzir categoria | P1 |
| RF-GOAL-04 | Progresso e conclusão | P1 |

### RF-DASH — Dashboard

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-DASH-01 | Totais: assinaturas, gasto mês/ano, próxima cobrança | P0 |
| RF-DASH-02 | Serviços esquecidos, economia possível, categorias | P0 |
| RF-DASH-03 | Alertas, timeline, gráficos, resumo IA | P0 |

### RF-AUD — Auditoria e logs

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-AUD-01 | Log de ações sensíveis (login, sync, export, delete) | P0 |
| RF-AUD-02 | Trilha de consentimentos LGPD | P0 |
| RF-AUD-03 | Visualização limitada para o próprio usuário | P1 |

## 2. Requisitos não funcionais

| ID | Categoria | Requisito | Meta |
|----|-----------|-----------|------|
| RNF-01 | Desempenho | p95 dashboard autenticado | < 400 ms (API agregada) |
| RNF-02 | Desempenho | p95 listagem assinaturas | < 300 ms |
| RNF-03 | Disponibilidade | Uptime API | 99.5% MVP / 99.9% scale |
| RNF-04 | Segurança | OWASP Top 10 mitigado | Ver SECURITY.md |
| RNF-05 | Privacidade | LGPD | Consentimento, minimização, exclusão |
| RNF-06 | Escalabilidade | Usuários | 100k+ com horizontal scaling |
| RNF-07 | Acessibilidade | WCAG | 2.1 AA |
| RNF-08 | Observabilidade | Erros | Sentry + OTel traces |
| RNF-09 | i18n | Idioma MVP | pt-BR (en-US fase 2) |
| RNF-10 | Moeda | MVP | BRL primário; multi-currency preparado |

## 3. Casos de uso principais

### UC-01 — Confirmar assinatura detectada

1. Sistema cria `DetectionProposal` após sync.
2. Usuário abre “Pendências”.
3. Vê merchant original, valor, frequência sugerida, fonte.
4. Confirma / edita / rejeita.
5. Em confirmação, cria `Subscription` e regra de aprendizado.

### UC-02 — Perguntar ao copiloto

1. Usuário digita: “Quanto gasto com streaming?”
2. IA invoca tool com filtro de categoria Streaming.
3. Retorna valor mensal/anual + lista + sugestão de economia se houver overlap.

### UC-03 — Conectar Open Finance

1. Usuário inicia consentimento.
2. Redireciona ao detentor (via iniciador/agregador homologado).
3. Callback com tokens cifrados em repouso.
4. Job importa transações; motor de detecção roda.
5. Usuário revisa propostas.

### UC-04 — Exportar relatório mensal

1. Usuário seleciona mês e formato (PDF/CSV).
2. API gera job ou resposta síncrona se leve.
3. Download via signed URL.

### UC-05 — Meta de economia

1. Usuário define “Economizar R$ 100/mês”.
2. Sistema sugere assinaturas candidatas a cancelar.
3. Ao cancelar/arquivar, progresso atualiza.

## 4. Personas

- **Ana (freelancer)**: muitas ferramentas SaaS; quer cortar desperdício.
- **Bruno (família)**: streaming e apps infantis; quer visibilidade conjunta (fase household).
- **Carla (estudante)**: trials e freemium; alertas de fim de teste.
- **Diego (profissional)**: cloud e IA; quer previsão anual e NF/recibos.

## 5. Fora de escopo do MVP (explícito)

- Marketplace de ofertas de cancelamento pagos
- Conta conjunta completa (household) — fase 2
- App nativo iOS/Android (PWA no MVP)
- Open Banking de investimento / crédito não recorrente
