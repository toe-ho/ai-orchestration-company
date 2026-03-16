import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IHeartbeatRunRepository } from '../../../domain/repositories/i-heartbeat-run-repository.js';
import { HEARTBEAT_RUN_REPOSITORY } from '../../../domain/repositories/i-heartbeat-run-repository.js';
import type { ICompanyVmRepository } from '../../../domain/repositories/i-company-vm-repository.js';
import { COMPANY_VM_REPOSITORY } from '../../../domain/repositories/i-company-vm-repository.js';
import type { IExecutionRunner } from '../../services/interface/i-execution-runner.js';
import { EXECUTION_RUNNER } from '../../services/interface/i-execution-runner.js';
import type { AppConfig } from '../../../config/app-config.js';

export class CancelRunCommand {
  constructor(
    public readonly runId: string,
    public readonly companyId: string,
  ) {}
}

@CommandHandler(CancelRunCommand)
export class CancelRunHandler implements ICommandHandler<CancelRunCommand, void> {
  private readonly logger = new Logger(CancelRunHandler.name);
  private readonly localExecutorUrl: string;

  constructor(
    @Inject(HEARTBEAT_RUN_REPOSITORY) private readonly runRepo: IHeartbeatRunRepository,
    @Inject(COMPANY_VM_REPOSITORY) private readonly vmRepo: ICompanyVmRepository,
    @Inject(EXECUTION_RUNNER) private readonly runner: IExecutionRunner,
    config: ConfigService,
  ) {
    this.localExecutorUrl = config.get<AppConfig>('app')!.localExecutorUrl;
  }

  async execute(cmd: CancelRunCommand): Promise<void> {
    const run = await this.runRepo.findByIdAndCompany(cmd.runId, cmd.companyId);
    if (!run) throw new NotFoundException(`Run ${cmd.runId} not found`);
    if (run.status !== 'running' && run.status !== 'queued') return;

    try {
      const vm = await this.vmRepo.findByCompanyId(cmd.companyId);
      // Use stored private IP for production, fall back to local executor URL in dev
      const executorUrl = vm && (vm as never as { privateIp: string | null }).privateIp
        ? `http://${(vm as never as { privateIp: string }).privateIp}:3200`
        : this.localExecutorUrl;
      await this.runner.cancel(executorUrl, cmd.runId);
    } catch (err) {
      this.logger.warn(`Failed to signal cancel to VM: ${err}`);
    }

    await this.runRepo.update(cmd.runId, { status: 'cancelled', finishedAt: new Date() });
  }
}
