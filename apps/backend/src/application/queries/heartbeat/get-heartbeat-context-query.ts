import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IAgentRepository } from '../../../domain/repositories/i-agent-repository.js';
import { AGENT_REPOSITORY } from '../../../domain/repositories/i-agent-repository.js';
import type { IIssueRepository } from '../../../domain/repositories/i-issue-repository.js';
import { ISSUE_REPOSITORY } from '../../../domain/repositories/i-issue-repository.js';
import type { IGoalRepository } from '../../../domain/repositories/i-goal-repository.js';
import { GOAL_REPOSITORY } from '../../../domain/repositories/i-goal-repository.js';

export class GetHeartbeatContextQuery {
  constructor(
    public readonly agentId: string,
    public readonly companyId: string,
  ) {}
}

/**
 * Assembles the execution context payload sent to the executor VM.
 * Phase 5 (Claude adapter) will enrich this with session data and tool configs.
 */
@QueryHandler(GetHeartbeatContextQuery)
export class GetHeartbeatContextHandler
  implements IQueryHandler<GetHeartbeatContextQuery, Record<string, unknown>>
{
  constructor(
    @Inject(AGENT_REPOSITORY) private readonly agentRepo: IAgentRepository,
    @Inject(ISSUE_REPOSITORY) private readonly issueRepo: IIssueRepository,
    @Inject(GOAL_REPOSITORY) private readonly goalRepo: IGoalRepository,
  ) {}

  async execute(query: GetHeartbeatContextQuery): Promise<Record<string, unknown>> {
    const [agent, peers, issues, goals] = await Promise.all([
      this.agentRepo.findByIdAndCompany(query.agentId, query.companyId),
      this.agentRepo.findOrgTree(query.companyId),
      this.issueRepo.findAllByCompany(query.companyId, { assigneeAgentId: query.agentId }),
      this.goalRepo.findAllByCompany(query.companyId),
    ]);

    return {
      agent,
      peers,
      assignedIssues: issues,
      goals,
      timestamp: new Date().toISOString(),
    };
  }
}
