import { Injectable } from '@nestjs/common';
import { toMonthlyCents, toYearlyCents } from '../../common/utils/money';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Deterministic financial tools for the copiloto.
 * Always scoped by userId from auth context — never from model output.
 */
@Injectable()
export class AiToolsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSpendingSummary(userId: string, categorySlug?: string) {
    const subs = await this.prisma.subscription.findMany({
      where: {
        userId,
        deletedAt: null,
        status: { in: ['ACTIVE', 'TRIAL', 'PAUSED'] },
        ...(categorySlug
          ? { category: { slug: categorySlug } }
          : {}),
      },
      include: { category: true },
    });

    let monthly = 0;
    let yearly = 0;
    const items = subs.map((s) => {
      const m = toMonthlyCents(s.amountCents, s.billingPeriod);
      const y = toYearlyCents(s.amountCents, s.billingPeriod);
      monthly += m;
      yearly += y;
      return {
        id: s.id,
        name: s.name,
        category: s.category.name,
        amountCents: s.amountCents,
        monthlyCents: m,
        billingPeriod: s.billingPeriod,
      };
    });

    return { monthlyCents: monthly, yearlyCents: yearly, currency: 'BRL', items };
  }

  async listSubscriptions(userId: string, filters?: { status?: string; unused?: boolean }) {
    return this.prisma.subscription.findMany({
      where: {
        userId,
        deletedAt: null,
        status: filters?.status as never,
        unused: filters?.unused,
      },
      include: { category: true },
      orderBy: { amountCents: 'desc' },
      take: 50,
    });
  }

  async getMostExpensive(userId: string, limit = 5) {
    const subs = await this.prisma.subscription.findMany({
      where: { userId, deletedAt: null, status: { in: ['ACTIVE', 'TRIAL'] } },
      include: { category: true },
    });
    return subs
      .map((s) => ({
        id: s.id,
        name: s.name,
        monthlyCents: toMonthlyCents(s.amountCents, s.billingPeriod),
        amountCents: s.amountCents,
        billingPeriod: s.billingPeriod,
        category: s.category.name,
      }))
      .sort((a, b) => b.monthlyCents - a.monthlyCents)
      .slice(0, limit);
  }

  async getUnusedCandidates(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId, deletedAt: null, unused: true, status: { in: ['ACTIVE', 'PAUSED'] } },
      include: { category: true },
    });
  }

  async getLifetimePaid(userId: string, nameQuery: string) {
    const subs = await this.prisma.subscription.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { name: { contains: nameQuery, mode: 'insensitive' } },
          { company: { contains: nameQuery, mode: 'insensitive' } },
        ],
      },
    });
    const results = [];
    for (const s of subs) {
      const paid = await this.prisma.charge.aggregate({
        where: { userId, subscriptionId: s.id, status: 'PAID' },
        _sum: { amountCents: true },
      });
      results.push({
        subscriptionId: s.id,
        name: s.name,
        paidCents: paid._sum.amountCents ?? 0,
        currency: s.currency,
      });
    }
    return results;
  }

  async estimateSavings(userId: string, subscriptionIds: string[]) {
    const subs = await this.prisma.subscription.findMany({
      where: { userId, id: { in: subscriptionIds }, deletedAt: null },
    });
    const monthly = subs.reduce(
      (acc, s) => acc + toMonthlyCents(s.amountCents, s.billingPeriod),
      0,
    );
    return {
      monthlySavingsCents: monthly,
      yearlySavingsCents: monthly * 12,
      subscriptions: subs.map((s) => s.name),
    };
  }

  async findRedundantServices(userId: string) {
    const subs = await this.prisma.subscription.findMany({
      where: { userId, deletedAt: null, status: { in: ['ACTIVE', 'TRIAL'] } },
      include: { category: true },
    });
    const byCat = new Map<string, typeof subs>();
    for (const s of subs) {
      const list = byCat.get(s.category.slug) ?? [];
      list.push(s);
      byCat.set(s.category.slug, list);
    }
    const redundant = [];
    for (const [slug, list] of byCat) {
      if (list.length >= 2 && ['streaming', 'music', 'cloud', 'ai'].includes(slug)) {
        redundant.push({
          category: slug,
          services: list.map((s) => s.name),
          monthlyCents: list.reduce(
            (a, s) => a + toMonthlyCents(s.amountCents, s.billingPeriod),
            0,
          ),
        });
      }
    }
    return redundant;
  }

  async forecastCharges(userId: string, days: number) {
    const to = new Date();
    to.setUTCDate(to.getUTCDate() + days);
    const charges = await this.prisma.charge.findMany({
      where: {
        userId,
        status: 'SCHEDULED',
        dueDate: { gte: new Date(), lte: to },
      },
      include: { subscription: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
    });
    const total = charges.reduce((a, c) => a + c.amountCents, 0);
    return { days, totalCents: total, charges };
  }

  async listPriceIncreases(userId: string) {
    const histories = await this.prisma.priceHistory.findMany({
      where: { userId },
      orderBy: { effectiveFrom: 'desc' },
      take: 100,
      include: { subscription: { select: { name: true, id: true } } },
    });
    // Group and find increases
    const bySub = new Map<string, typeof histories>();
    for (const h of histories) {
      const list = bySub.get(h.subscriptionId) ?? [];
      list.push(h);
      bySub.set(h.subscriptionId, list);
    }
    const increases = [];
    for (const [, list] of bySub) {
      const sorted = [...list].sort(
        (a, b) => a.effectiveFrom.getTime() - b.effectiveFrom.getTime(),
      );
      if (sorted.length < 2) continue;
      const prev = sorted[sorted.length - 2];
      const last = sorted[sorted.length - 1];
      if (last.amountCents > prev.amountCents) {
        increases.push({
          subscriptionId: last.subscriptionId,
          name: last.subscription.name,
          fromCents: prev.amountCents,
          toCents: last.amountCents,
          effectiveFrom: last.effectiveFrom,
        });
      }
    }
    return increases;
  }

  async suggestCancellations(userId: string) {
    const unused = await this.getUnusedCandidates(userId);
    const redundant = await this.findRedundantServices(userId);
    const expensive = await this.getMostExpensive(userId, 3);
    return {
      unused: unused.map((s) => ({
        id: s.id,
        name: s.name,
        monthlyCents: toMonthlyCents(s.amountCents, s.billingPeriod),
        reason: 'Marcada como sem uso',
      })),
      redundantCategories: redundant,
      topExpensive: expensive,
    };
  }

  async executeTool(
    userId: string,
    name: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    switch (name) {
      case 'get_spending_summary':
        return this.getSpendingSummary(userId, args.categorySlug as string | undefined);
      case 'list_subscriptions':
        return this.listSubscriptions(userId, args as { status?: string; unused?: boolean });
      case 'get_most_expensive':
        return this.getMostExpensive(userId, (args.limit as number) ?? 5);
      case 'get_unused_candidates':
        return this.getUnusedCandidates(userId);
      case 'get_lifetime_paid':
        return this.getLifetimePaid(userId, String(args.nameQuery ?? ''));
      case 'estimate_savings':
        return this.estimateSavings(userId, (args.subscriptionIds as string[]) ?? []);
      case 'find_redundant_services':
        return this.findRedundantServices(userId);
      case 'forecast_charges':
        return this.forecastCharges(userId, (args.days as number) ?? 7);
      case 'list_price_increases':
        return this.listPriceIncreases(userId);
      case 'suggest_cancellations':
        return this.suggestCancellations(userId);
      default:
        return { error: `Tool desconhecida: ${name}` };
    }
  }
}
