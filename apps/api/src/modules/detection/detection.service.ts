import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BillingPeriod,
  ProposalStatus,
  SubscriptionSource,
  SubscriptionStatus,
} from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MerchantNormalizer } from './merchant-normalizer';
import { RecurrenceDetector } from './recurrence-detector';

export interface IngestEventInput {
  source: SubscriptionSource;
  occurredAt: Date;
  amountCents?: number;
  currency?: string;
  merchantRaw?: string;
  description?: string;
  payload: Record<string, unknown>;
  connectionId?: string;
}

@Injectable()
export class DetectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly normalizer: MerchantNormalizer,
    private readonly recurrence: RecurrenceDetector,
  ) {}

  async listProposals(userId: string, status: ProposalStatus = ProposalStatus.PENDING) {
    return this.prisma.detectionProposal.findMany({
      where: { userId, status },
      orderBy: { createdAt: 'desc' },
    });
  }

  async ingest(userId: string, events: IngestEventInput[]) {
    let created = 0;
    for (const e of events) {
      const merchantNorm = e.merchantRaw
        ? (await this.normalizer.resolveCanonical(userId, e.merchantRaw)).normalized
        : null;
      const fingerprint = this.fingerprint(e);
      try {
        await this.prisma.rawEvent.create({
          data: {
            userId,
            connectionId: e.connectionId,
            source: e.source,
            fingerprint,
            occurredAt: e.occurredAt,
            amountCents: e.amountCents,
            currency: e.currency ?? 'BRL',
            merchantRaw: e.merchantRaw,
            merchantNorm,
            description: e.description,
            payload: e.payload as object,
          },
        });
        created++;
      } catch {
        // unique fingerprint — skip duplicate
      }
    }
    return { ingested: created };
  }

  async runForUser(userId: string) {
    const unprocessed = await this.prisma.rawEvent.findMany({
      where: { userId, processedAt: null },
      orderBy: { occurredAt: 'asc' },
      take: 500,
    });

    // Group by merchantNorm
    const groups = new Map<string, typeof unprocessed>();
    for (const ev of unprocessed) {
      const key = ev.merchantNorm ?? ev.merchantRaw ?? 'unknown';
      const list = groups.get(key) ?? [];
      list.push(ev);
      groups.set(key, list);
    }

    let proposals = 0;
    for (const [merchantKey, events] of groups) {
      const timed = events
        .filter((e) => e.amountCents != null)
        .map((e) => ({
          occurredAt: e.occurredAt,
          amountCents: e.amountCents!,
          merchantNorm: merchantKey,
        }));

      const result = this.recurrence.detect(timed);
      if (!result.isRecurring && timed.length < 2) {
        // still create soft proposal for single high-signal email invoices later
        await this.prisma.rawEvent.updateMany({
          where: { id: { in: events.map((e) => e.id) } },
          data: { processedAt: new Date() },
        });
        continue;
      }

      if (!result.isRecurring) {
        await this.prisma.rawEvent.updateMany({
          where: { id: { in: events.map((e) => e.id) } },
          data: { processedAt: new Date() },
        });
        continue;
      }

      const sample = events[events.length - 1];
      const resolved = sample.merchantRaw
        ? await this.normalizer.resolveCanonical(userId, sample.merchantRaw)
        : { canonical: merchantKey, normalized: merchantKey, fromAlias: false };

      // Skip if already has active subscription with same canonical name
      const existingSub = await this.prisma.subscription.findFirst({
        where: {
          userId,
          deletedAt: null,
          status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
          OR: [
            { name: { equals: resolved.canonical, mode: 'insensitive' } },
            { company: { equals: resolved.canonical, mode: 'insensitive' } },
          ],
        },
      });
      if (existingSub) {
        await this.prisma.rawEvent.updateMany({
          where: { id: { in: events.map((e) => e.id) } },
          data: { processedAt: new Date() },
        });
        continue;
      }

      const pending = await this.prisma.detectionProposal.findFirst({
        where: {
          userId,
          status: ProposalStatus.PENDING,
          suggestedName: resolved.canonical,
        },
      });
      if (!pending) {
        await this.prisma.detectionProposal.create({
          data: {
            userId,
            suggestedName: resolved.canonical,
            suggestedCompany: resolved.canonical,
            suggestedAmount: result.medianAmount,
            suggestedPeriod: result.period,
            confidence: result.confidence,
            source: sample.source,
            evidenceEventIds: events.map((e) => e.id),
            rawEventId: sample.id,
            rationale: result.rationale,
          },
        });
        proposals++;
      }

      await this.prisma.rawEvent.updateMany({
        where: { id: { in: events.map((e) => e.id) } },
        data: { processedAt: new Date() },
      });
    }

    return { processedEvents: unprocessed.length, proposalsCreated: proposals };
  }

  async confirm(
    userId: string,
    proposalId: string,
    overrides?: {
      name?: string;
      categoryId?: string;
      amountCents?: number;
      billingPeriod?: BillingPeriod;
      nextBillingDate?: string;
    },
  ) {
    const proposal = await this.prisma.detectionProposal.findFirst({
      where: { id: proposalId, userId },
    });
    if (!proposal) throw new NotFoundException();
    if (proposal.status !== ProposalStatus.PENDING) {
      throw new BadRequestException('Proposta já resolvida');
    }

    let categoryId = overrides?.categoryId;
    if (!categoryId) {
      const other = await this.prisma.category.findFirst({
        where: { isSystem: true, slug: 'other' },
      });
      if (!other) throw new BadRequestException('Categoria padrão ausente — execute o seed');
      categoryId = other.id;
    }

    const nextBillingDate = overrides?.nextBillingDate
      ? new Date(overrides.nextBillingDate)
      : this.defaultNextBilling(proposal.suggestedPeriod);

    const amount = overrides?.amountCents ?? proposal.suggestedAmount;
    const period = overrides?.billingPeriod ?? proposal.suggestedPeriod;
    const name = overrides?.name ?? proposal.suggestedName;

    const sub = await this.prisma.subscription.create({
      data: {
        userId,
        categoryId,
        name,
        company: proposal.suggestedCompany,
        amountCents: amount,
        currency: proposal.currency,
        billingPeriod: period,
        nextBillingDate,
        status: SubscriptionStatus.ACTIVE,
        source: proposal.source,
        lastSyncedAt: new Date(),
        priceHistories: {
          create: { userId, amountCents: amount, currency: proposal.currency },
        },
        charges: {
          create: {
            userId,
            amountCents: amount,
            currency: proposal.currency,
            dueDate: nextBillingDate,
            status: 'SCHEDULED',
          },
        },
      },
    });

    await this.normalizer.learn(userId, proposal.suggestedName, name, {
      company: proposal.suggestedCompany ?? undefined,
      subscriptionId: sub.id,
    });

    await this.prisma.detectionProposal.update({
      where: { id: proposalId },
      data: {
        status: ProposalStatus.CONFIRMED,
        subscriptionId: sub.id,
        resolvedAt: new Date(),
      },
    });

    return sub;
  }

  async reject(userId: string, proposalId: string) {
    const proposal = await this.prisma.detectionProposal.findFirst({
      where: { id: proposalId, userId },
    });
    if (!proposal) throw new NotFoundException();
    return this.prisma.detectionProposal.update({
      where: { id: proposalId },
      data: { status: ProposalStatus.REJECTED, resolvedAt: new Date() },
    });
  }

  async merge(userId: string, proposalId: string, subscriptionId: string) {
    const proposal = await this.prisma.detectionProposal.findFirst({
      where: { id: proposalId, userId },
    });
    if (!proposal) throw new NotFoundException();
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, userId, deletedAt: null },
    });
    if (!sub) throw new NotFoundException('Assinatura alvo não encontrada');

    await this.normalizer.learn(userId, proposal.suggestedName, sub.name, {
      company: sub.company ?? undefined,
      subscriptionId: sub.id,
    });

    return this.prisma.detectionProposal.update({
      where: { id: proposalId },
      data: {
        status: ProposalStatus.MERGED,
        subscriptionId: sub.id,
        resolvedAt: new Date(),
      },
    });
  }

  private fingerprint(e: IngestEventInput): string {
    const base = [
      e.source,
      e.occurredAt.toISOString(),
      e.amountCents ?? '',
      e.merchantRaw ?? '',
      e.description ?? '',
      JSON.stringify(e.payload),
    ].join('|');
    return createHash('sha256').update(base).digest('hex');
  }

  private defaultNextBilling(period: BillingPeriod): Date {
    const d = new Date();
    switch (period) {
      case BillingPeriod.WEEKLY:
        d.setUTCDate(d.getUTCDate() + 7);
        break;
      case BillingPeriod.QUARTERLY:
        d.setUTCMonth(d.getUTCMonth() + 3);
        break;
      case BillingPeriod.SEMIANNUAL:
        d.setUTCMonth(d.getUTCMonth() + 6);
        break;
      case BillingPeriod.YEARLY:
        d.setUTCFullYear(d.getUTCFullYear() + 1);
        break;
      default:
        d.setUTCMonth(d.getUTCMonth() + 1);
    }
    return d;
  }
}
