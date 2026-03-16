import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import type { IAgentWakeupRequest } from '@aicompany/shared';
import { AgentWakeupRequestModel } from '../persistence/models/agent-wakeup-request-model.js';
import type { IAgentWakeupRepository } from '../../domain/repositories/i-agent-wakeup-repository.js';

@Injectable()
export class AgentWakeupRepository implements IAgentWakeupRepository {
  constructor(
    @InjectRepository(AgentWakeupRequestModel)
    private readonly repo: Repository<AgentWakeupRequestModel>,
  ) {}

  async create(data: Partial<IAgentWakeupRequest>): Promise<IAgentWakeupRequest> {
    const entity = this.repo.create(data as AgentWakeupRequestModel);
    return this.repo.save(entity);
  }

  findPendingWithinWindow(agentId: string, windowMs: number): Promise<IAgentWakeupRequest[]> {
    const since = new Date(Date.now() - windowMs);
    return this.repo.findBy({
      agentId,
      processedAt: IsNull(),
      createdAt: MoreThan(since),
    });
  }

  async markProcessed(id: string): Promise<void> {
    await this.repo.update(id, { processedAt: new Date() } as never);
  }
}
