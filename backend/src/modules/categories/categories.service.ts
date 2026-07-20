import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.category.findMany({
      where: {
        OR: [{ isSystem: true, userId: null }, { userId }],
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async create(userId: string, dto: CreateCategoryDto) {
    const slug = dto.slug ?? dto.name.toLowerCase().replace(/\s+/g, '-').slice(0, 60);
    return this.prisma.category.create({
      data: {
        userId,
        name: dto.name,
        slug,
        isSystem: false,
        sortOrder: dto.sortOrder ?? 50,
      },
    });
  }

  async remove(userId: string, id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException();
    if (cat.isSystem || cat.userId !== userId) {
      throw new ForbiddenException('Categoria do sistema não pode ser removida');
    }
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }
}
