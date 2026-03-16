import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { IHeartbeatRun } from '@aicompany/shared';
import type { IHeartbeatRunRepository } from '../../../domain/repositories/i-heartbeat-run-repository.js';
import { HEARTBEAT_RUN_REPOSITORY } from '../../../domain/repositories/i-heartbeat-run-repository.js';

export class GetRunQuery {
  constructor(
    public readonly runId: string,
    public readonly companyId: string,
  ) {}
}

@QueryHandler(GetRunQuery)
export class GetRunHandler implements IQueryHandler<GetRunQuery, IHeartbeatRun> {
  constructor(
    @Inject(HEARTBEAT_RUN_REPOSITORY) private readonly runRepo: IHeartbeatRunRepository,
  ) {}

  async execute(query: GetRunQuery): Promise<IHeartbeatRun> {
    const run = await this.runRepo.findByIdAndCompany(query.runId, query.companyId);
    if (!run) throw new NotFoundException(`Run ${query.runId} not found`);
    return run;
  }
}
