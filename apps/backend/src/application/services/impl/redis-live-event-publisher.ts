import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { IExecutionEvent } from '@aicompany/shared';
import type { ILiveEventPublisher } from '../interface/i-live-event-publisher.js';
import type { RedisConfig } from '../../../config/redis-config.js';

/** Publishes live run events to Redis pub/sub for real-time streaming (consumed by Phase 7 WebSocket) */
@Injectable()
export class RedisLiveEventPublisher implements ILiveEventPublisher, OnModuleDestroy {
  private readonly logger = new Logger(RedisLiveEventPublisher.name);
  private readonly redis: Redis;

  constructor(config: ConfigService) {
    const { url } = config.get<RedisConfig>('redis')!;
    this.redis = new Redis(url);
  }

  async publish(companyId: string, runId: string, event: IExecutionEvent): Promise<void> {
    const channel = `live:${companyId}:${runId}`;
    try {
      await this.redis.publish(channel, JSON.stringify(event));
    } catch (err) {
      this.logger.warn(`Failed to publish live event: ${err}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
