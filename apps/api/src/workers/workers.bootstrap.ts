import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AiService } from '../modules/ai/ai.service';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Lightweight in-process schedulers for local/dev worker.
 * Production: replace with BullMQ repeatable jobs + Redis.
 */
@Injectable()
export class WorkersBootstrap implements OnModuleInit {
  private readonly logger = new Logger(WorkersBootstrap.name);

  constructor(
    private readonly notifications: NotificationsService,
    private readonly ai: AiService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    // Charge reminders every hour
    setInterval(() => {
      this.notifications
        .processChargeReminders()
        .then((r) => this.logger.log(`Charge reminders: ${JSON.stringify(r)}`))
        .catch((e) => this.logger.error(e));
    }, 60 * 60 * 1000);

    // Daily insights refresh (every 6h scan users with activity)
    setInterval(() => {
      this.refreshInsightsBatch().catch((e) => this.logger.error(e));
    }, 6 * 60 * 60 * 1000);

    this.logger.log('Worker schedules registered');
  }

  private async refreshInsightsBatch() {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null, onboardingDoneAt: { not: null } },
      select: { id: true },
      take: 100,
    });
    for (const u of users) {
      await this.ai.refreshInsights(u.id);
    }
    this.logger.log(`Insights refreshed for ${users.length} users`);
  }
}
