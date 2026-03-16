import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { BudgetExceededEvent } from '../budget-exceeded-event.js';
import type { IAgentRepository } from '../../../domain/repositories/i-agent-repository.js';
import { AGENT_REPOSITORY } from '../../../domain/repositories/i-agent-repository.js';

/** Auto-pauses an agent when its monthly budget is exceeded */
@EventsHandler(BudgetExceededEvent)
export class OnBudgetExceededHandler implements IEventHandler<BudgetExceededEvent> {
  private readonly logger = new Logger(OnBudgetExceededHandler.name);

  constructor(
    @Inject(AGENT_REPOSITORY) private readonly agentRepo: IAgentRepository,
  ) {}

  async handle(event: BudgetExceededEvent): Promise<void> {
    this.logger.warn(
      `Agent ${event.agentId} exceeded budget: ${event.spentCents}/${event.budgetCents} cents — pausing`,
    );
    try {
      await this.agentRepo.update(event.agentId, { status: 'paused' });
    } catch (err) {
      this.logger.error(`Failed to pause agent on budget exceeded: ${err}`);
    }
  }
}
