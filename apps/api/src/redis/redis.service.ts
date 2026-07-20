import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(config: ConfigService) {
    const url = config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    this.client = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    });
    this.client.on('error', (err) => {
      this.logger.warn(`Redis: ${err.message}`);
    });
  }

  async connect() {
    try {
      if (this.client.status === 'wait') {
        await this.client.connect();
      }
    } catch (err) {
      this.logger.warn(`Redis connect skipped: ${err instanceof Error ? err.message : err}`);
    }
  }

  async get(key: string) {
    try {
      await this.connect();
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    try {
      await this.connect();
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
        return;
      }
      await this.client.set(key, value);
    } catch {
      // cache optional
    }
  }

  async del(key: string) {
    try {
      await this.connect();
      await this.client.del(key);
    } catch {
      // optional
    }
  }

  async onModuleDestroy() {
    try {
      if (this.client.status === 'ready') {
        await this.client.quit();
      }
    } catch {
      // ignore
    }
  }
}
