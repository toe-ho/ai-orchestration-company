import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IAgentRepository } from '../../../domain/repositories/i-agent-repository.js';
import { AGENT_REPOSITORY } from '../../../domain/repositories/i-agent-repository.js';
import type { IAgent } from '@aicompany/shared';

export class GetOrgTreeQuery {
  constructor(public readonly companyId: string) {}
}

/** Returns agents ordered so roots come first, children after — flat list for tree rendering */
@QueryHandler(GetOrgTreeQuery)
export class GetOrgTreeHandler implements IQueryHandler<GetOrgTreeQuery, IAgent[]> {
  constructor(
    @Inject(AGENT_REPOSITORY) private readonly agentRepo: IAgentRepository,
  ) {}

  execute(query: GetOrgTreeQuery): Promise<IAgent[]> {
    return this.agentRepo.findOrgTree(query.companyId);
  }
}
