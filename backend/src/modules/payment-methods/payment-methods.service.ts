import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.paymentMethod.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  create(userId: string, dto: CreatePaymentMethodDto) {
    return this.prisma.paymentMethod.create({
      data: {
        userId,
        type: dto.type,
        label: dto.label,
        brand: dto.brand,
        last4: dto.last4,
        bankName: dto.bankName,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async remove(userId: string, id: string) {
    const pm = await this.prisma.paymentMethod.findFirst({ where: { id, userId } });
    if (!pm) throw new NotFoundException();
    await this.prisma.paymentMethod.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }
}
