import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        locale: true,
        timezone: true,
        currency: true,
        emailVerifiedAt: true,
        onboardingDoneAt: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async update(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        locale: dto.locale,
        timezone: dto.timezone,
        currency: dto.currency,
        avatarUrl: dto.avatarUrl,
        onboardingDoneAt: dto.completeOnboarding ? new Date() : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        locale: true,
        timezone: true,
        currency: true,
        onboardingDoneAt: true,
      },
    });
  }

  async requestExport(userId: string) {
    // Job assíncrono em produção; MVP retorna payload síncrono leve
    const [subscriptions, charges, consents] = await Promise.all([
      this.prisma.subscription.findMany({ where: { userId, deletedAt: null } }),
      this.prisma.charge.findMany({ where: { userId } }),
      this.prisma.consent.findMany({ where: { userId } }),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      subscriptions,
      charges,
      consents,
    };
  }

  async softDelete(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), email: `deleted+${userId}@invalid.local` },
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }
}
