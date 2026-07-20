import { Injectable } from '@nestjs/common';
import { ProposalStatus, SubscriptionStatus, BillingPeriod } from '@prisma/client';
import { toMonthlyCents, toYearlyCents } from '../../common/utils/money';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: string) {

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        userId,
        deletedAt: null,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL, SubscriptionStatus.PAUSED] },
      },
      include: { category: true },
      orderBy: { nextBillingDate: 'asc' },
    });

    let monthlyTotal = 0;
    let yearlyTotal = 0;
    const byCategory: Record<string, { name: string; cents: number }> = {};

    for (const s of subscriptions) {
      const m = toMonthlyCents(s.amountCents, s.billingPeriod as BillingPeriod);
      const y = toYearlyCents(s.amountCents, s.billingPeriod as BillingPeriod);
      monthlyTotal += m;
      yearlyTotal += y;
      const key = s.category.slug;
      byCategory[key] = byCategory[key] ?? { name: s.category.name, cents: 0 };
      byCategory[key].cents += m;
    }

    const nextCharge = subscriptions[0]
      ? {
          subscriptionId: subscriptions[0].id,
          name: subscriptions[0].name,
          amountCents: subscriptions[0].amountCents,
          currency: subscriptions[0].currency,
          date: subscriptions[0].nextBillingDate,
        }
      : null;

    const forgotten = subscriptions.filter((s) => s.unused);
    const possibleSavingsCents = forgotten.reduce(
      (acc, s) => acc + toMonthlyCents(s.amountCents, s.billingPeriod as BillingPeriod),
      0,
    );

    const pendingProposals = await this.prisma.detectionProposal.count({
      where: { userId, status: ProposalStatus.PENDING },
    });

    const insights = await this.prisma.insight.findMany({
      where: { userId, dismissedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const recentCharges = await this.prisma.charge.findMany({
      where: { userId },
      include: { subscription: { select: { name: true } } },
      orderBy: { dueDate: 'desc' },
      take: 15,
    });

    const aiSummary =
      insights[0]?.body ??
      (subscriptions.length === 0
        ? 'Você ainda não tem assinaturas. Conecte uma fonte ou cadastre manualmente.'
        : `Você tem ${subscriptions.length} assinaturas ativas com gasto estimado de ${(monthlyTotal / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por mês.`);

    const payload = {
      totals: {
        activeSubscriptions: subscriptions.length,
        monthlySpendCents: monthlyTotal,
        yearlySpendCents: yearlyTotal,
        currency: 'BRL',
      },
      nextCharge,
      forgotten: forgotten.map((s) => ({
        id: s.id,
        name: s.name,
        amountCents: s.amountCents,
        billingPeriod: s.billingPeriod,
      })),
      possibleSavingsCents,
      byCategory: Object.entries(byCategory).map(([slug, v]) => ({
        slug,
        name: v.name,
        monthlyCents: v.cents,
      })),
      pendingProposals,
      insights,
      timeline: recentCharges,
      aiSummary,
      generatedAt: new Date().toISOString(),
    };

    return payload;
  }
}
