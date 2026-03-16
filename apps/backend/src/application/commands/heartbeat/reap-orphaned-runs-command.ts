import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import type { IHeartbeatRunRepository } from '../../../domain/repositories/i-heartbeat-run-repository.js';
import { HEARTBEAT_RUN_REPOSITORY } from '../../../domain/repositories/i-heartbeat-run-repository.js';
import type { IHeartbeatRunEventRepository } from '../../../domain/repositories/i-heartbeat-run-event-repository.js';
import { HEARTBEAT_RUN_EVENT_REPOSITORY } from '../../../domain/repositories/i-heartbeat-run-event-repository.js';
import { HeartbeatRunCompletedEvent } from '../../events/heartbeat-run-completed-event.js';

const ORPHAN_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export class ReapOrphanedRunsCommand {}

/** Marks runs stuck in 'running' for >10 min as timed_out */
@CommandHandler(ReapOrphanedRunsCommand)
export class ReapOrphanedRunsHandler implements ICommandHandler<ReapOrphanedRunsCommand, void> {
  private readonly logger = new Logger(ReapOrphanedRunsHandler.name);

  constructor(
    @Inject(HEARTBEAT_RUN_REPOSITORY) private readonly runRepo: IHeartbeatRunRepository,
    @Inject(HEARTBEAT_RUN_EVENT_REPOSITORY) private readonly eventRepo: IHeartbeatRunEventRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(): Promise<void> {
    const cutoff = new Date(Date.now() - ORPHAN_TIMEOUT_MS);
    const orphans = await this.runRepo.findOrphanedRuns(cutoff);

    for (const run of orphans) {
      const lastEvent = await this.eventRepo.getLastEventTime(run.id);
      if (lastEvent && lastEvent > cutoff) continue; // still active

      this.logger.warn(`Reaping orphaned run ${run.id} for agent ${run.agentId}`);
      await this.runRepo.update(run.id, { status: 'timed_out', finishedAt: new Date() });
      this.eventBus.publish(
        new HeartbeatRunCompletedEvent(run.id, run.agentId, run.companyId, 'timed_out', 0, 0, 0),
      );
    }
  }
}
