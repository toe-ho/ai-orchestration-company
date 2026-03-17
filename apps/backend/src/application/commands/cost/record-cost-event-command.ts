import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { ICostEventRepository } from '../../../domain/repositories/i-cost-event-repository.js';
import { COST_EVENT_REPOSITORY } from '../../../domain/repositories/i-cost-event-repository.js';
import type { CostEventModel } from '../../../infrastructure/persistence/models/cost-event-model.js';

export class RecordCostEventCommand {
  constructor(
    public readonly companyId: string,
    public readonly agentId: string,
    public readonly provider: string,
    public readonly model: string,
    public readonly inputTokens: number,
    public readonly outputTokens: number,
    public readonly costCents: number,
    public readonly runId?: string,
    public readonly computeCostCents?: number,
  ) {}
}

@CommandHandler(RecordCostEventCommand)
export class RecordCostEventHandler implements ICommandHandler<RecordCostEventCommand, CostEventModel> {
  constructor(
    @Inject(COST_EVENT_REPOSITORY) private readonly repo: ICostEventRepository,
  ) {}

  execute(cmd: RecordCostEventCommand): Promise<CostEventModel> {
    return this.repo.create({
      companyId: cmd.companyId,
      agentId: cmd.agentId,
      runId: cmd.runId ?? null,
      provider: cmd.provider,
      model: cmd.model,
      inputTokens: cmd.inputTokens,
      outputTokens: cmd.outputTokens,
      costCents: cmd.costCents,
      computeCostCents: cmd.computeCostCents ?? 0,
    });
  }
}
