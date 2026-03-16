import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IHeartbeatRun } from '@aicompany/shared';
import type { IHeartbeatRunRepository } from '../../../domain/repositories/i-heartbeat-run-repository.js';
import { HEARTBEAT_RUN_REPOSITORY } from '../../../domain/repositories/i-heartbeat-run-repository.js';

export class GetLiveRunsQuery {
  constructor(public readonly agentId: string) {}
}

@QueryHandler(GetLiveRunsQuery)
export class GetLiveRunsHandler implements IQueryHandler<GetLiveRunsQuery, IHeartbeatRun[]> {
  constructor(
    @Inject(HEARTBEAT_RUN_REPOSITORY) private readonly runRepo: IHeartbeatRunRepository,
  ) {}

  execute(query: GetLiveRunsQuery): Promise<IHeartbeatRun[]> {
    return this.runRepo.findActiveByAgent(query.agentId);
  }
}
