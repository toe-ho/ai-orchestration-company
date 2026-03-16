import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { IAgentRepository } from '../../../domain/repositories/i-agent-repository.js';
import { AGENT_REPOSITORY } from '../../../domain/repositories/i-agent-repository.js';
import type { IAgent } from '@aicompany/shared';

export class GetAgentQuery {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
  ) {}
}

@QueryHandler(GetAgentQuery)
export class GetAgentHandler implements IQueryHandler<GetAgentQuery, IAgent> {
  constructor(
    @Inject(AGENT_REPOSITORY) private readonly agentRepo: IAgentRepository,
  ) {}

  async execute(query: GetAgentQuery): Promise<IAgent> {
    const agent = await this.agentRepo.findByIdAndCompany(query.id, query.companyId);
    if (!agent) throw new NotFoundException(`Agent ${query.id} not found`);
    return agent;
  }
}
