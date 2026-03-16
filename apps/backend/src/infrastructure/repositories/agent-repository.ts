import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IAgent } from '@aicompany/shared';
import { AgentModel } from '../persistence/models/agent-model.js';
import type {
  IAgentRepository,
  AgentFilters,
} from '../../domain/repositories/i-agent-repository.js';
import { BaseRepository } from './base-repository.js';

@Injectable()
export class AgentRepository
  extends BaseRepository<AgentModel>
  implements IAgentRepository
{
  constructor(
    @InjectRepository(AgentModel)
    repo: Repository<AgentModel>,
  ) {
    super(repo);
  }

  findByIdAndCompany(id: string, companyId: string): Promise<IAgent | null> {
    return this.repo.findOneBy({ id, companyId });
  }

  findAllByCompany(companyId: string, filters?: AgentFilters): Promise<IAgent[]> {
    const where: Record<string, unknown> = { companyId };
    if (filters?.status) where['status'] = filters.status;
    return this.repo.findBy(where as never);
  }

  /** Returns flat list of all agents — caller builds the tree */
  findOrgTree(companyId: string): Promise<IAgent[]> {
    return this.repo.findBy({ companyId });
  }
}
