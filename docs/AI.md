# Inteligência Artificial — Copiloto Financeiro

## 1. Objetivos

A IA interpreta dados do usuário e responde com **ações e números verificáveis**, não com texto genérico.

## 2. Arquitetura

```
User message
  → Guardrails (tamanho, rate limit, abuse)
  → LLM (OpenAI) com tools (function calling)
  → Tool executor (Nest services, scoped userId)
  → LLM formula resposta final
  → Persist AiMessage + usage metrics
```

### Quando usar RAG

- Histórico longo de conversas (retrieval das últimas interações relevantes)
- Base de conhecimento de “como cancelar X” (docs internos)
- **Não** usar RAG para totais financeiros — preferir SQL/tools determinísticos

### Quando usar function calling

- Qualquer pergunta quantitativa
- Listagens filtradas
- Previsões baseadas em regras + dados reais

## 3. Tools (funções)

| Tool | Descrição |
|------|-----------|
| `get_spending_summary` | Totais por período/categoria |
| `list_subscriptions` | Filtros status/categoria/fonte |
| `get_most_expensive` | Ranking |
| `get_unused_candidates` | Marcadas ou sem uso inferido |
| `get_lifetime_paid` | Soma histórica por assinatura |
| `estimate_savings` | Economia ao cancelar conjunto |
| `find_redundant_services` | Overlap de categoria/função |
| `forecast_charges` | Próximos N dias / ano |
| `list_price_increases` | Diff de price_history |
| `suggest_cancellations` | Heurística + ranking |

Todas as tools recebem `userId` do contexto de segurança, **nunca** do modelo.

## 4. Insights automáticos

Job diário gera `Insight` records:

- Aumento de preço detectado
- Duplicidade (ex.: dois streamings similares)
- Gasto acima da média móvel 3 meses
- Trials expirando em 72h
- Economia potencial (assinaturas unused)

Dashboard consome cache Redis + DB.

## 5. Exemplos de perguntas (aceitação)

| Pergunta | Tool path |
|----------|-----------|
| Quanto gasto com streaming? | get_spending_summary(category=STREAMING) |
| Qual a mais cara? | get_most_expensive(limit=1) |
| Quanto já paguei na Netflix? | get_lifetime_paid(name~Netflix) |
| Quanto nos próximos 7 dias? | forecast_charges(days=7) |
| O que posso cancelar? | suggest_cancellations |

## 6. Modelos

- Chat: `gpt-4o-mini` default (custo); upgrade configurável
- Embeddings: `text-embedding-3-small` para aliases e RAG
- Temperatura baixa (0.1–0.3) em respostas financeiras

## 7. Custos e limites

- Budget diário de tokens por usuário
- Cache de respostas idênticas (hash da pergunta + snapshot de dados version)
- Circuit breaker se OpenAI indisponível → insights pré-computados only

## 8. Avaliação de qualidade

- Golden set de 50 perguntas com respostas esperadas (± tolerância)
- CI offline com mocks de tools
- Review humano amostral em produção (opt-in)
