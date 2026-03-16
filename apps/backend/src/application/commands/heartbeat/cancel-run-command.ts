import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import type { IHeartbeatRunRepository } from '../../../domain/repositories/i-heartbeat-run-repository.js';
import { HEARTBEAT_RUN_REPOSITORY } from '../../../domain/repositories/i-heartbeat-run-repository.js';
import type { IExecutionRunner } from '../../services/interface/i-execution-runner.js';
import { EXECUTION_RUNNER } from '../../services/interface/i-execution-runner.js';

export class CancelRunCommand {
  constructor(
    public readonly runId: string,
    public readonly companyId: string,
  ) {}
}

@CommandHandler(CancelRunCommand)
export class CancelRunHandler implements ICommandHandler<CancelRunCommand, void> {
  private readonly logger = new Logger(CancelRunHandler.name);

  constructor(
    @Inject(HEARTBEAT_RUN_REPOSITORY) private readonly runRepo: IHeartbeatRunRepository,
    @Inject(EXECUTION_RUNNER) private readonly runner: IExecutionRunner,
  ) {}

  async execute(cmd: CancelRunCommand): Promise<void> {
    const run = await this.runRepo.findByIdAndCompany(cmd.runId, cmd.companyId);
    if (!run) throw new NotFoundException(`Run ${cmd.runId} not found`);
    if (run.status !== 'running' && run.status !== 'queued') return;

    try {
      await this.runner.cancel('', cmd.runId);
    } catch (err) {
      this.logger.warn(`Failed to signal cancel to VM: ${err}`);
    }

    await this.runRepo.update(cmd.runId, {
      status: 'cancelled',
      finishedAt: new Date(),
    });
  }
}
