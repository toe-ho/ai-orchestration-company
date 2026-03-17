import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentApiKeyModel } from '../persistence/models/agent-api-key-model.js';

export interface IAgentApiKeyRepository {
  create(data: Partial<AgentApiKeyModel>): Promise<AgentApiKeyModel>;
  findByHash(keyHash: string): Promise<AgentApiKeyModel | null>;
  findByAgent(agentId: string): Promise<AgentApiKeyModel[]>;
  revoke(id: string): Promise<void>;
}

export const AGENT_API_KEY_REPOSITORY = Symbol('IAgentApiKeyRepository');

@Injectable()
export class AgentApiKeyRepository implements IAgentApiKeyRepository {
  constructor(
    @InjectRepository(AgentApiKeyModel)
    private readonly repo: Repository<AgentApiKeyModel>,
  ) {}

  async create(data: Partial<AgentApiKeyModel>): Promise<AgentApiKeyModel> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  findByHash(keyHash: string): Promise<AgentApiKeyModel | null> {
    return this.repo.findOneBy({ keyHash });
  }

  findByAgent(agentId: string): Promise<AgentApiKeyModel[]> {
    return this.repo.findBy({ agentId });
  }

  async revoke(id: string): Promise<void> {
    await this.repo.update(id, { revokedAt: new Date() });
  }
}
