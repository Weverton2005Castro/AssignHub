import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SubscriptionSource } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ListSubscriptionsDto } from './dto/list-subscriptions.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, query: ListSubscriptionsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.SubscriptionWhereInput = {
      userId,
      deletedAt: null,
      status: query.status,
      categoryId: query.categoryId,
      source: query.source,
      amountCents: {
        gte: query.minAmountCents,
        lte: query.maxAmountCents,
      },
      OR: query.q
        ? [
            { name: { contains: query.q, mode: 'insensitive' } },
            { company: { contains: query.q, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.subscription.findMany({
        where,
        include: { category: true, paymentMethod: true },
        orderBy: { [query.sort ?? 'nextBillingDate']: query.order ?? 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return { data: items, meta: { page, pageSize, total } };
  }

  async get(userId: string, id: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        category: true,
        paymentMethod: true,
        priceHistories: { orderBy: { effectiveFrom: 'desc' }, take: 50 },
      },
    });
    if (!sub) throw new NotFoundException('Assinatura não encontrada');
    return sub;
  }

  async create(userId: string, dto: CreateSubscriptionDto) {
    const nextBillingDate = new Date(dto.nextBillingDate);
    const sub = await this.prisma.subscription.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        paymentMethodId: dto.paymentMethodId ?? null,
        name: dto.name,
        company: dto.company,
        logoUrl: dto.logoUrl || null,
        amountCents: dto.amountCents,
        currency: dto.currency ?? 'BRL',
        billingPeriod: dto.billingPeriod,
        customPeriodDays: dto.customPeriodDays,
        nextBillingDate,
        autoRenew: dto.autoRenew ?? true,
        planName: dto.planName,
        notes: dto.notes,
        officialUrl: dto.officialUrl || null,
        status: dto.status ?? 'ACTIVE',
        source: SubscriptionSource.MANUAL,
        unused: dto.unused ?? false,
        priceHistories: {
          create: {
            userId,
            amountCents: dto.amountCents,
            currency: dto.currency ?? 'BRL',
          },
        },
        charges: {
          create: {
            userId,
            amountCents: dto.amountCents,
            currency: dto.currency ?? 'BRL',
            dueDate: nextBillingDate,
            status: 'SCHEDULED',
          },
        },
      },
      include: { category: true },
    });
    return sub;
  }

  async update(userId: string, id: string, dto: UpdateSubscriptionDto) {
    const existing = await this.get(userId, id);
    const priceChanged =
      dto.amountCents !== undefined && dto.amountCents !== existing.amountCents;

    const sub = await this.prisma.subscription.update({
      where: { id },
      data: {
        categoryId: dto.categoryId,
        paymentMethodId: dto.paymentMethodId,
        name: dto.name,
        company: dto.company,
        logoUrl: dto.logoUrl,
        amountCents: dto.amountCents,
        currency: dto.currency,
        billingPeriod: dto.billingPeriod,
        customPeriodDays: dto.customPeriodDays,
        nextBillingDate: dto.nextBillingDate ? new Date(dto.nextBillingDate) : undefined,
        autoRenew: dto.autoRenew,
        planName: dto.planName,
        notes: dto.notes,
        officialUrl: dto.officialUrl,
        status: dto.status,
        unused: dto.unused,
        priceHistories: priceChanged
          ? {
              create: {
                userId,
                amountCents: dto.amountCents!,
                currency: dto.currency ?? existing.currency,
                note: 'Atualização manual de preço',
              },
            }
          : undefined,
      },
      include: { category: true, priceHistories: { orderBy: { effectiveFrom: 'desc' }, take: 20 } },
    });
    return sub;
  }

  async softDelete(userId: string, id: string) {
    await this.get(userId, id);
    await this.prisma.subscription.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    });
    return { success: true };
  }

  async listCharges(userId: string, id: string) {
    await this.get(userId, id);
    return this.prisma.charge.findMany({
      where: { userId, subscriptionId: id },
      orderBy: { dueDate: 'desc' },
    });
  }

  async priceHistory(userId: string, id: string) {
    await this.get(userId, id);
    return this.prisma.priceHistory.findMany({
      where: { userId, subscriptionId: id },
      orderBy: { effectiveFrom: 'asc' },
    });
  }
}
