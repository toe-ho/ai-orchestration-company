import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IHeartbeatRunEvent } from '@aicompany/shared';
import type { IHeartbeatRunEventRepository } from '../../../domain/repositories/i-heartbeat-run-event-repository.js';
import { HEARTBEAT_RUN_EVENT_REPOSITORY } from '../../../domain/repositories/i-heartbeat-run-event-repository.js';

export class ListRunEventsQuery {
  constructor(public readonly runId: string) {}
}

@QueryHandler(ListRunEventsQuery)
export class ListRunEventsHandler implements IQueryHandler<ListRunEventsQuery, IHeartbeatRunEvent[]> {
  constructor(
    @Inject(HEARTBEAT_RUN_EVENT_REPOSITORY) private readonly eventRepo: IHeartbeatRunEventRepository,
  ) {}

  execute(query: ListRunEventsQuery): Promise<IHeartbeatRunEvent[]> {
    return this.eventRepo.listByRun(query.runId);
  }
}
