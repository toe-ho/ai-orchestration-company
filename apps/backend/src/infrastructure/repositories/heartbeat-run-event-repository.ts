import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IHeartbeatRunEvent } from '@aicompany/shared';
import { HeartbeatRunEventModel } from '../persistence/models/heartbeat-run-event-model.js';
import type { IHeartbeatRunEventRepository } from '../../domain/repositories/i-heartbeat-run-event-repository.js';

@Injectable()
export class HeartbeatRunEventRepository implements IHeartbeatRunEventRepository {
  constructor(
    @InjectRepository(HeartbeatRunEventModel)
    private readonly repo: Repository<HeartbeatRunEventModel>,
  ) {}

  async insertEvent(data: Omit<IHeartbeatRunEvent, 'id'>): Promise<IHeartbeatRunEvent> {
    const entity = this.repo.create(data as HeartbeatRunEventModel);
    return this.repo.save(entity);
  }

  listByRun(runId: string): Promise<IHeartbeatRunEvent[]> {
    return this.repo.find({ where: { runId }, order: { seq: 'ASC' } });
  }

  async getLastEventTime(runId: string): Promise<Date | null> {
    const event = await this.repo.findOne({
      where: { runId },
      order: { seq: 'DESC' },
    });
    return event?.createdAt ?? null;
  }
}
