import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import type { IAgentWakeupRepository } from '../../../domain/repositories/i-agent-wakeup-repository.js';
import { AGENT_WAKEUP_REPOSITORY } from '../../../domain/repositories/i-agent-wakeup-repository.js';
import { InvokeHeartbeatCommand } from './invoke-heartbeat-command.js';

const COALESCE_WINDOW_MS = 30_000;

export class WakeupAgentCommand {
  constructor(
    public readonly agentId: string,
    public readonly companyId: string,
    public readonly source: string,
    public readonly payload?: Record<string, unknown>,
  ) {}
}

/** Coalesces duplicate wakeup requests within 30s window, then dispatches heartbeat */
@CommandHandler(WakeupAgentCommand)
export class WakeupAgentHandler implements ICommandHandler<WakeupAgentCommand, void> {
  private readonly logger = new Logger(WakeupAgentHandler.name);

  constructor(
    @Inject(AGENT_WAKEUP_REPOSITORY) private readonly wakeupRepo: IAgentWakeupRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(cmd: WakeupAgentCommand): Promise<void> {
    const pending = await this.wakeupRepo.findPendingWithinWindow(cmd.agentId, COALESCE_WINDOW_MS);
    if (pending.length > 0) {
      this.logger.debug(`Coalescing wakeup for agent ${cmd.agentId} — ${pending.length} pending`);
      return;
    }

    const request = await this.wakeupRepo.create({
      agentId: cmd.agentId,
      companyId: cmd.companyId,
      source: cmd.source,
      payload: cmd.payload ?? null,
    });

    await this.commandBus.execute(new InvokeHeartbeatCommand(cmd.agentId, cmd.companyId, cmd.source));
    await this.wakeupRepo.markProcessed(request.id);
  }
}
