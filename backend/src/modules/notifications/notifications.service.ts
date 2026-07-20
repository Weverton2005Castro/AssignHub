import { Injectable } from '@nestjs/common';
import {
  ChargeStatus,
  NotificationChannel,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        readAt: unreadOnly ? null : undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async getPreferences(userId: string) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL] },
      update: {},
    });
  }

  async updatePreferences(
    userId: string,
    data: {
      channels?: NotificationChannel[];
      chargeReminders?: boolean;
      priceIncrease?: boolean;
      newDetections?: boolean;
      savingsTips?: boolean;
      marketing?: boolean;
    },
  ) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        channels: data.channels ?? [NotificationChannel.IN_APP],
        chargeReminders: data.chargeReminders ?? true,
        priceIncrease: data.priceIncrease ?? true,
        newDetections: data.newDetections ?? true,
        savingsTips: data.savingsTips ?? true,
        marketing: data.marketing ?? false,
      },
      update: data,
    });
  }

  async registerDevice(userId: string, fcmToken: string, platform?: string) {
    return this.prisma.device.upsert({
      where: { fcmToken },
      create: { userId, fcmToken, platform },
      update: { userId, platform, lastSeenAt: new Date() },
    });
  }

  async createIdempotent(input: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    channel?: NotificationChannel;
    data?: Prisma.InputJsonValue;
    idempotencyKey: string;
  }) {
    try {
      return await this.prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          channel: input.channel ?? NotificationChannel.IN_APP,
          data: input.data,
          idempotencyKey: input.idempotencyKey,
          sentAt: new Date(),
        },
      });
    } catch {
      return null; // duplicate idempotency
    }
  }

  /** Daily job: charge reminders */
  async processChargeReminders() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const chargesToday = await this.prisma.charge.findMany({
      where: { status: ChargeStatus.SCHEDULED, dueDate: today },
      include: { subscription: true },
    });
    const chargesTomorrow = await this.prisma.charge.findMany({
      where: { status: ChargeStatus.SCHEDULED, dueDate: tomorrow },
      include: { subscription: true },
    });

    for (const c of chargesToday) {
      await this.createIdempotent({
        userId: c.userId,
        type: NotificationType.CHARGE_TODAY,
        title: 'Cobrança hoje',
        body: `${c.subscription.name} — R$ ${(c.amountCents / 100).toFixed(2)}`,
        idempotencyKey: `charge-today-${c.id}-${today.toISOString().slice(0, 10)}`,
        data: { chargeId: c.id, subscriptionId: c.subscriptionId },
      });
    }
    for (const c of chargesTomorrow) {
      await this.createIdempotent({
        userId: c.userId,
        type: NotificationType.CHARGE_TOMORROW,
        title: 'Cobrança amanhã',
        body: `${c.subscription.name} — R$ ${(c.amountCents / 100).toFixed(2)}`,
        idempotencyKey: `charge-tomorrow-${c.id}-${today.toISOString().slice(0, 10)}`,
        data: { chargeId: c.id, subscriptionId: c.subscriptionId },
      });
    }

    return {
      today: chargesToday.length,
      tomorrow: chargesTomorrow.length,
    };
  }
}
