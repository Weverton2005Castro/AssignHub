import { Injectable, NotFoundException } from '@nestjs/common';
import { GoalStatus, GoalType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.goal.findMany({
      where: { userId, status: { not: GoalStatus.CANCELLED } },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(
    userId: string,
    data: {
      type: GoalType;
      title: string;
      targetCents?: number;
      targetCount?: number;
      categoryId?: string;
      deadline?: string;
    },
  ) {
    return this.prisma.goal.create({
      data: {
        userId,
        type: data.type,
        title: data.title,
        targetCents: data.targetCents,
        targetCount: data.targetCount,
        categoryId: data.categoryId,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    data: Partial<{
      title: string;
      targetCents: number;
      targetCount: number;
      currentCents: number;
      currentCount: number;
      status: GoalStatus;
    }>,
  ) {
    const goal = await this.prisma.goal.findFirst({ where: { id, userId } });
    if (!goal) throw new NotFoundException();
    const completed =
      data.status === GoalStatus.COMPLETED ||
      (data.currentCents !== undefined &&
        goal.targetCents &&
        data.currentCents >= goal.targetCents) ||
      (data.currentCount !== undefined &&
        goal.targetCount &&
        data.currentCount >= goal.targetCount);

    return this.prisma.goal.update({
      where: { id },
      data: {
        ...data,
        status: completed ? GoalStatus.COMPLETED : data.status,
        completedAt: completed ? new Date() : undefined,
      },
    });
  }

  async cancel(userId: string, id: string) {
    const goal = await this.prisma.goal.findFirst({ where: { id, userId } });
    if (!goal) throw new NotFoundException();
    return this.prisma.goal.update({
      where: { id },
      data: { status: GoalStatus.CANCELLED },
    });
  }
}
