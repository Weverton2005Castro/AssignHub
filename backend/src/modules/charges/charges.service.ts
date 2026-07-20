import { Injectable, NotFoundException } from '@nestjs/common';
import { ChargeStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChargesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, from?: string, to?: string) {
    return this.prisma.charge.findMany({
      where: {
        userId,
        dueDate: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
      },
      include: {
        subscription: { select: { id: true, name: true, logoUrl: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async calendar(userId: string, year: number, month: number) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    const charges = await this.list(userId, start.toISOString(), end.toISOString());
    const byDay: Record<string, typeof charges> = {};
    for (const c of charges) {
      const key = c.dueDate.toISOString().slice(0, 10);
      byDay[key] = byDay[key] ?? [];
      byDay[key].push(c);
    }
    return { year, month, days: byDay };
  }

  async updateStatus(userId: string, id: string, status: ChargeStatus) {
    const charge = await this.prisma.charge.findFirst({ where: { id, userId } });
    if (!charge) throw new NotFoundException();
    return this.prisma.charge.update({
      where: { id },
      data: {
        status,
        paidAt: status === ChargeStatus.PAID ? new Date() : charge.paidAt,
      },
    });
  }
}
