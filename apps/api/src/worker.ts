/**
 * Worker process entrypoint (BullMQ consumers).
 * Same codebase as API; run as separate process for horizontal scaling.
 */
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['log', 'error', 'warn'],
  });
  Logger.log('SubscriptionHub worker started', 'Worker');
  // Keep process alive; queues register on module init
  process.on('SIGTERM', async () => {
    await app.close();
    process.exit(0);
  });
}

bootstrap();
