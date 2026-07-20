import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DetectionModule } from './modules/detection/detection.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AiModule } from './modules/ai/ai.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { WorkersBootstrap } from './workers/workers.bootstrap';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    DetectionModule,
    IntegrationsModule,
    NotificationsModule,
    AiModule,
  ],
  providers: [WorkersBootstrap],
})
export class WorkerModule {}
