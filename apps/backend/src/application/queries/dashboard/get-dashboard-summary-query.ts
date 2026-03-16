import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { IAgentRepository } from '../../../domain/repositories/i-agent-repository.js';
import { AGENT_REPOSITORY } from '../../../domain/repositories/i-agent-repository.js';

export interface DashboardSummary {
  agentCount: number;
  issueCount: number;
  activeIssueCount: number;
  agentsByStatus: Record<string, number>;
}

export class GetDashboardSummaryQuery {
  constructor(public readonly companyId: string) {}
}

@QueryHandler(GetDashboardSummaryQuery)
export class GetDashboardSummaryHandler
  implements IQueryHandler<GetDashboardSummaryQuery, DashboardSummary>
{
  constructor(
    @Inject(AGENT_REPOSITORY) private readonly agentRepo: IAgentRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(query: GetDashboardSummaryQuery): Promise<DashboardSummary> {
    const { companyId } = query;

    const [agents, issueCounts] = await Promise.all([
      this.agentRepo.findAllByCompany(companyId),
      this.dataSource.query<{ status: string; cnt: string }[]>(
        `SELECT status, COUNT(*) AS cnt FROM issues WHERE company_id = $1 GROUP BY status`,
        [companyId],
      ),
    ]);

    let issueCount = 0;
    let activeIssueCount = 0;
    for (const row of issueCounts) {
      const n = parseInt(row.cnt, 10);
      issueCount += n;
      if (row.status === 'in_progress') activeIssueCount = n;
    }

    const agentsByStatus: Record<string, number> = {};
    for (const agent of agents) {
      agentsByStatus[agent.status] = (agentsByStatus[agent.status] ?? 0) + 1;
    }

    return { agentCount: agents.length, issueCount, activeIssueCount, agentsByStatus };
  }
}
