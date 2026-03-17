import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { CompanyEvent, ICompanyEventPublisher } from '../interface/i-company-event-publisher.js';
import type { RedisConfig } from '../../../config/redis-config.js';

/** Publishes company-level events to Redis pub/sub channel `company:{companyId}` */
@Injectable()
export class RedisCompanyEventPublisher implements ICompanyEventPublisher, OnModuleDestroy {
  private readonly logger = new Logger(RedisCompanyEventPublisher.name);
  private readonly redis: Redis;

  constructor(config: ConfigService) {
    const { url } = config.get<RedisConfig>('redis')!;
    this.redis = new Redis(url);
  }

  async publishCompanyEvent(companyId: string, event: CompanyEvent): Promise<void> {
    const channel = `company:${companyId}`;
    try {
      await this.redis.publish(channel, JSON.stringify(event));
    } catch (err) {
      this.logger.warn(`Failed to publish company event: ${err}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
