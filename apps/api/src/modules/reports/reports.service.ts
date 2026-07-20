import { Injectable, NotFoundException } from '@nestjs/common';
import { BillingPeriod, ReportFormat, ReportJobStatus, SubscriptionStatus } from '@prisma/client';
import { toMonthlyCents } from '@subscriptionhub/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string, from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const charges = await this.prisma.charge.findMany({
      where: {
        userId,
        dueDate: { gte: fromDate, lte: toDate },
      },
      include: {
        subscription: { include: { category: true } },
      },
    });

    const byCategory: Record<string, number> = {};
    const byCompany: Record<string, number> = {};
    let total = 0;

    for (const c of charges) {
      total += c.amountCents;
      const cat = c.subscription.category.name;
      const company = c.subscription.company ?? c.subscription.name;
      byCategory[cat] = (byCategory[cat] ?? 0) + c.amountCents;
      byCompany[company] = (byCompany[company] ?? 0) + c.amountCents;
    }

    const active = await this.prisma.subscription.findMany({
      where: { userId, deletedAt: null, status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] } },
      include: { category: true },
    });

    const projectedMonthly = active.reduce(
      (a, s) => a + toMonthlyCents(s.amountCents, s.billingPeriod as BillingPeriod),
      0,
    );

    return {
      from,
      to,
      totalCents: total,
      byCategory,
      byCompany,
      chargeCount: charges.length,
      projectedMonthlyCents: projectedMonthly,
      activeSubscriptions: active.length,
    };
  }

  async export(
    userId: string,
    input: { type: string; format: ReportFormat; from: string; to: string },
  ) {
    const summary = await this.summary(userId, input.from, input.to);
    const job = await this.prisma.reportJob.create({
      data: {
        userId,
        type: input.type,
        format: input.format,
        status: ReportJobStatus.PROCESSING,
        params: input,
      },
    });

    // MVP: generate inline (CSV string as data URL style content)
    let content: string;
    if (input.format === ReportFormat.CSV) {
      const lines = ['category,amount_cents'];
      for (const [k, v] of Object.entries(summary.byCategory)) {
        lines.push(`"${k}",${v}`);
      }
      content = lines.join('\n');
    } else {
      content = JSON.stringify(
        {
          title: 'SubscriptionHub Report',
          ...summary,
          note: 'PDF binário seria gerado via worker + storage signed URL em produção',
        },
        null,
        2,
      );
    }

    // In production: upload to Supabase Storage and set fileUrl
    const fileUrl = `data:text/${input.format === 'CSV' ? 'csv' : 'plain'};base64,${Buffer.from(content).toString('base64')}`;

    return this.prisma.reportJob.update({
      where: { id: job.id },
      data: {
        status: ReportJobStatus.READY,
        fileUrl,
        completedAt: new Date(),
      },
    });
  }

  async getExport(userId: string, jobId: string) {
    const job = await this.prisma.reportJob.findFirst({
      where: { id: jobId, userId },
    });
    if (!job) throw new NotFoundException();
    return job;
  }
}
