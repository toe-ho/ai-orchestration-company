import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { HeartbeatRunCompletedEvent } from '../heartbeat-run-completed-event.js';
import type { IAgentRuntimeStateRepository } from '../.././../domain/repositories/i-agent-runtime-state-repository.js';
import { AGENT_RUNTIME_STATE_REPOSITORY } from '../../../domain/repositories/i-agent-runtime-state-repository.js';
import type { IAgentRepository } from '../../../domain/repositories/i-agent-repository.js';
import { AGENT_REPOSITORY } from '../../../domain/repositories/i-agent-repository.js';

/** Updates runtime state and agent cumulative spend on run completion */
@EventsHandler(HeartbeatRunCompletedEvent)
export class OnHeartbeatCompletedHandler implements IEventHandler<HeartbeatRunCompletedEvent> {
  private readonly logger = new Logger(OnHeartbeatCompletedHandler.name);

  constructor(
    @Inject(AGENT_RUNTIME_STATE_REPOSITORY)
    private readonly runtimeStateRepo: IAgentRuntimeStateRepository,
    @Inject(AGENT_REPOSITORY) private readonly agentRepo: IAgentRepository,
  ) {}

  async handle(event: HeartbeatRunCompletedEvent): Promise<void> {
    try {
      await this.runtimeStateRepo.upsert(event.agentId, event.companyId, {
        currentRunId: null,
        cumulativeInputTokens: event.inputTokens,
        cumulativeOutputTokens: event.outputTokens,
        cumulativeCostCents: event.totalCostCents,
      });

      const agent = await this.agentRepo.findById(event.agentId);
      if (agent) {
        await this.agentRepo.update(event.agentId, {
          spentMonthlyCents: agent.spentMonthlyCents + event.totalCostCents,
          status: 'idle',
        });
      }
    } catch (err) {
      this.logger.error(`Failed to handle HeartbeatRunCompleted: ${err}`);
    }
  }
}
