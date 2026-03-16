import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IHeartbeatRun } from '@aicompany/shared';
import type { IHeartbeatRunRepository } from '../../../domain/repositories/i-heartbeat-run-repository.js';
import { HEARTBEAT_RUN_REPOSITORY } from '../../../domain/repositories/i-heartbeat-run-repository.js';

export class ListRunsQuery {
  constructor(
    public readonly companyId: string,
    public readonly agentId?: string,
    public readonly limit?: number,
  ) {}
}

@QueryHandler(ListRunsQuery)
export class ListRunsHandler implements IQueryHandler<ListRunsQuery, IHeartbeatRun[]> {
  constructor(
    @Inject(HEARTBEAT_RUN_REPOSITORY) private readonly runRepo: IHeartbeatRunRepository,
  ) {}

  execute(query: ListRunsQuery): Promise<IHeartbeatRun[]> {
    if (query.agentId) {
      return this.runRepo.listByAgent(query.companyId, query.agentId, query.limit);
    }
    return this.runRepo.listByCompany(query.companyId, query.limit);
  }
}
