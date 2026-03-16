import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IAgentRuntimeState } from '@aicompany/shared';
import { AgentRuntimeStateModel } from '../persistence/models/agent-runtime-state-model.js';
import type { IAgentRuntimeStateRepository } from '../../domain/repositories/i-agent-runtime-state-repository.js';

@Injectable()
export class AgentRuntimeStateRepository implements IAgentRuntimeStateRepository {
  constructor(
    @InjectRepository(AgentRuntimeStateModel)
    private readonly repo: Repository<AgentRuntimeStateModel>,
  ) {}

  findByAgent(agentId: string): Promise<IAgentRuntimeState | null> {
    return this.repo.findOneBy({ agentId });
  }

  async upsert(
    agentId: string,
    companyId: string,
    data: Partial<IAgentRuntimeState>,
  ): Promise<IAgentRuntimeState> {
    const existing = await this.findByAgent(agentId);
    if (existing) {
      await this.repo.update(existing.id, data as never);
      return (await this.findByAgent(agentId))!;
    }
    const entity = this.repo.create({ agentId, companyId, ...data } as AgentRuntimeStateModel);
    return this.repo.save(entity);
  }
}
