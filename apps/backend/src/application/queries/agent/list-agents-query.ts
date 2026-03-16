import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IAgentRepository } from '../../../domain/repositories/i-agent-repository.js';
import { AGENT_REPOSITORY } from '../../../domain/repositories/i-agent-repository.js';
import type { IAgent } from '@aicompany/shared';

export class ListAgentsQuery {
  constructor(
    public readonly companyId: string,
    public readonly status?: string,
  ) {}
}

@QueryHandler(ListAgentsQuery)
export class ListAgentsHandler implements IQueryHandler<ListAgentsQuery, IAgent[]> {
  constructor(
    @Inject(AGENT_REPOSITORY) private readonly agentRepo: IAgentRepository,
  ) {}

  execute(query: ListAgentsQuery): Promise<IAgent[]> {
    return this.agentRepo.findAllByCompany(query.companyId, { status: query.status });
  }
}
