import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  live() {
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      let redisOk = false;
      try {
        await this.redis.connect();
        const pong = await this.redis.client.ping();
        redisOk = pong === 'PONG';
      } catch {
        redisOk = false;
      }
      // DB is required; Redis is optional in local dev
      return { status: 'ready', db: true, redis: redisOk };
    } catch {
      throw new ServiceUnavailableException({ status: 'not_ready' });
    }
  }
}
