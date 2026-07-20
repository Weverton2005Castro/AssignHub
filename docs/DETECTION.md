# Motor de detecção de recorrência

## Entradas

| Fonte | Evento bruto | Exemplos |
|-------|--------------|----------|
| Open Finance | Transação | `GOOGLE*SPOTIFY`, valor, data |
| Gmail | Mensagem classificada | subject invoice/receipt |
| Lojas | Compra/assinatura | Google Play, Apple |
| Manual | N/A | Usuário cadastra |

## Pipeline

1. **Ingest** — `RawEvent` com `fingerprint` SHA-256 (idempotente)
2. **Normalize** — `MerchantNormalizer` (regras globais + aliases do usuário)
3. **Group** — por `merchantNorm`
4. **RecurrenceDetector** — intervalos + consistência de valor
5. **Proposal** — `DetectionProposal` com score e evidências
6. **Human confirm** — confirma / rejeita / mescla
7. **Learn** — grava `MerchantAlias` permanente

## Limiares

- Mínimo 2 eventos para recorrência forte
- Confiança >= 0.55 para criar proposta
- Tolerância de valor: 5% da mediana (mín. R$ 1,00)
- Tolerância de intervalo: 20% do período alvo

## Aprendizado

Após confirmação, aliases como `google*spotify` → `Spotify` ficam no escopo do usuário, evitando re-perguntas e unificando descrições diferentes.
