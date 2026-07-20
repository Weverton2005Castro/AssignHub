import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { formatMoney } from '@subscriptionhub/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AiToolsService } from './ai-tools.service';

const TOOL_DEFINITIONS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_spending_summary',
      description: 'Totais de gasto por período e categoria opcional (slug: streaming, ai, cloud...)',
      parameters: {
        type: 'object',
        properties: {
          categorySlug: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_most_expensive',
      description: 'Ranking das assinaturas mais caras (mensalizado)',
      parameters: {
        type: 'object',
        properties: { limit: { type: 'number' } },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_unused_candidates',
      description: 'Assinaturas marcadas como sem uso',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_lifetime_paid',
      description: 'Soma já paga em cobranças PAID por nome de serviço',
      parameters: {
        type: 'object',
        properties: { nameQuery: { type: 'string' } },
        required: ['nameQuery'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'forecast_charges',
      description: 'Previsão de cobranças nos próximos N dias',
      parameters: {
        type: 'object',
        properties: { days: { type: 'number' } },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_redundant_services',
      description: 'Serviços potencialmente redundantes na mesma categoria',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_price_increases',
      description: 'Aumentos de preço detectados no histórico',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_cancellations',
      description: 'Sugestões de cancelamento e economia',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'estimate_savings',
      description: 'Estima economia ao cancelar IDs de assinatura',
      parameters: {
        type: 'object',
        properties: {
          subscriptionIds: { type: 'array', items: { type: 'string' } },
        },
        required: ['subscriptionIds'],
      },
    },
  },
];

const SYSTEM_PROMPT = `Você é o Copiloto Financeiro do SubscriptionHub.
Responda em português do Brasil, de forma clara, objetiva e profissional.
Use sempre as tools para números. Nunca invente valores.
Formate moeda em BRL quando apropriado.
Seja proativo: ao final, se fizer sentido, sugira uma ação (cancelar, revisar, conectar fonte).
Nunca revele dados de outros usuários. Nunca peça senhas ou dados de cartão completos.`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI | null;
  private readonly model: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly tools: AiToolsService,
  ) {
    const key = this.config.get<string>('OPENAI_API_KEY');
    this.openai = key ? new OpenAI({ apiKey: key }) : null;
    this.model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
  }

  async chat(userId: string, message: string, conversationId?: string) {
    let conversation = conversationId
      ? await this.prisma.aiConversation.findFirst({
          where: { id: conversationId, userId },
        })
      : null;

    if (!conversation) {
      conversation = await this.prisma.aiConversation.create({
        data: {
          userId,
          title: message.slice(0, 80),
        },
      });
    }

    await this.prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: message,
      },
    });

    const history = await this.prisma.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 30,
    });

    if (!this.openai) {
      const fallback = await this.heuristicAnswer(userId, message);
      await this.prisma.aiMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: fallback,
        },
      });
      return {
        conversationId: conversation.id,
        message: fallback,
        mode: 'heuristic',
      };
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((m) => ({
        role: m.role === 'USER' ? ('user' as const) : ('assistant' as const),
        content: m.content,
      })),
    ];

    let completion = await this.openai.chat.completions.create({
      model: this.model,
      messages,
      tools: TOOL_DEFINITIONS,
      temperature: 0.2,
    });

    let assistantMsg = completion.choices[0]?.message;
    const maxToolRounds = 4;
    let rounds = 0;

    while (assistantMsg?.tool_calls?.length && rounds < maxToolRounds) {
      rounds++;
      messages.push(assistantMsg);
      for (const call of assistantMsg.tool_calls) {
        if (call.type !== 'function') continue;
        const args = JSON.parse(call.function.arguments || '{}') as Record<string, unknown>;
        const result = await this.tools.executeTool(userId, call.function.name, args);
        await this.prisma.aiMessage.create({
          data: {
            conversationId: conversation.id,
            role: 'TOOL',
            content: JSON.stringify(result),
            toolName: call.function.name,
            toolPayload: args as object,
          },
        });
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
      completion = await this.openai.chat.completions.create({
        model: this.model,
        messages,
        tools: TOOL_DEFINITIONS,
        temperature: 0.2,
      });
      assistantMsg = completion.choices[0]?.message;
    }

    const text =
      assistantMsg?.content ??
      'Não foi possível gerar uma resposta. Tente reformular a pergunta.';

    await this.prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: text,
        tokenUsage: completion.usage?.total_tokens,
      },
    });

    return {
      conversationId: conversation.id,
      message: text,
      mode: 'openai',
      usage: completion.usage,
    };
  }

  async listConversations(userId: string) {
    return this.prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
  }

  async getConversation(userId: string, id: string) {
    return this.prisma.aiConversation.findFirst({
      where: { id, userId },
      include: {
        messages: {
          where: { role: { in: ['USER', 'ASSISTANT'] } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async listInsights(userId: string) {
    return this.prisma.insight.findMany({
      where: { userId, dismissedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async refreshInsights(userId: string) {
    const suggestions = await this.tools.suggestCancellations(userId);
    const forecast = await this.tools.forecastCharges(userId, 7);
    const increases = await this.tools.listPriceIncreases(userId);

    const created = [];

    if (suggestions.unused.length) {
      const monthly = suggestions.unused.reduce((a, s) => a + s.monthlyCents, 0);
      created.push(
        await this.prisma.insight.create({
          data: {
            userId,
            type: 'unused',
            title: 'Assinaturas sem uso',
            body: `${suggestions.unused.length} assinatura(s) marcadas como sem uso. Economia potencial: ${formatMoney(monthly)}/mês.`,
            severity: 'warning',
            data: suggestions.unused as object,
          },
        }),
      );
    }

    if (forecast.totalCents > 0) {
      created.push(
        await this.prisma.insight.create({
          data: {
            userId,
            type: 'forecast_7d',
            title: 'Próximos 7 dias',
            body: `Você deve gastar ${formatMoney(forecast.totalCents)} em cobranças programadas nos próximos 7 dias.`,
            severity: 'info',
            data: { totalCents: forecast.totalCents },
          },
        }),
      );
    }

    if (increases.length) {
      created.push(
        await this.prisma.insight.create({
          data: {
            userId,
            type: 'price_increase',
            title: 'Aumentos de preço',
            body: `${increases.length} assinatura(s) tiveram aumento de preço registrado.`,
            severity: 'warning',
            data: increases as object,
          },
        }),
      );
    }

    if (suggestions.redundantCategories.length) {
      created.push(
        await this.prisma.insight.create({
          data: {
            userId,
            type: 'redundant',
            title: 'Possíveis redundâncias',
            body: `Há categorias com múltiplos serviços similares. Vale revisar se todos são necessários.`,
            severity: 'info',
            data: suggestions.redundantCategories as object,
          },
        }),
      );
    }

    return created;
  }

  /**
   * Fallback when OpenAI is not configured: keyword routing to tools.
   */
  private async heuristicAnswer(userId: string, message: string): Promise<string> {
    const q = message.toLowerCase();
    try {
      if (q.includes('streaming')) {
        const s = await this.tools.getSpendingSummary(userId, 'streaming');
        return `Você gasta cerca de ${formatMoney(s.monthlyCents)} por mês com streaming (${formatMoney(s.yearlyCents)}/ano), em ${s.items.length} serviço(s).`;
      }
      if (q.includes(' ia') || q.includes('inteligência') || q.includes('ai')) {
        const s = await this.tools.getSpendingSummary(userId, 'ai');
        return `Gasto com IA: ${formatMoney(s.monthlyCents)}/mês (${formatMoney(s.yearlyCents)}/ano).`;
      }
      if (q.includes('mais cara') || q.includes('mais caro')) {
        const top = await this.tools.getMostExpensive(userId, 1);
        if (!top[0]) return 'Não há assinaturas ativas para analisar.';
        return `A assinatura mais cara (mensalizado) é ${top[0].name}: ${formatMoney(top[0].monthlyCents)}/mês.`;
      }
      if (q.includes('econom') || q.includes('cancel')) {
        const s = await this.tools.suggestCancellations(userId);
        const unused = s.unused.map((u) => u.name).join(', ') || 'nenhuma marcada';
        return `Sugestão de economia: revise as sem uso (${unused}). Também confira categorias com serviços semelhantes.`;
      }
      if (q.includes('7 dias') || q.includes('próximos')) {
        const f = await this.tools.forecastCharges(userId, 7);
        return `Nos próximos 7 dias estão previstas cobranças de ${formatMoney(f.totalCents)}.`;
      }
      if (q.includes('ano')) {
        const s = await this.tools.getSpendingSummary(userId);
        return `Estimativa anual com as assinaturas atuais: ${formatMoney(s.yearlyCents)}.`;
      }
      const s = await this.tools.getSpendingSummary(userId);
      return `Resumo: ${s.items.length} assinaturas ativas, ${formatMoney(s.monthlyCents)}/mês e ${formatMoney(s.yearlyCents)}/ano. Pergunte sobre streaming, IA, economia ou próximos 7 dias.`;
    } catch (err) {
      this.logger.error(err);
      return 'Não consegui calcular agora. Tente novamente em instantes.';
    }
  }
}
