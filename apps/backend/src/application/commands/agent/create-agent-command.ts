import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IAgentRepository } from '../../../domain/repositories/i-agent-repository.js';
import { AGENT_REPOSITORY } from '../../../domain/repositories/i-agent-repository.js';
import type { IAgent } from '@aicompany/shared';

export class CreateAgentCommand {
  constructor(
    public readonly companyId: string,
    public readonly name: string,
    public readonly role: string,
    public readonly adapterType: string,
    public readonly title?: string,
    public readonly reportsTo?: string,
    public readonly adapterConfig?: Record<string, unknown>,
    public readonly runtimeConfig?: Record<string, unknown>,
    public readonly budgetMonthlyCents?: number,
    public readonly permissions?: Record<string, unknown>,
  ) {}
}

@CommandHandler(CreateAgentCommand)
export class CreateAgentHandler implements ICommandHandler<CreateAgentCommand, IAgent> {
  constructor(
    @Inject(AGENT_REPOSITORY) private readonly agentRepo: IAgentRepository,
  ) {}

  execute(cmd: CreateAgentCommand): Promise<IAgent> {
    return this.agentRepo.create({
      companyId: cmd.companyId,
      name: cmd.name,
      role: cmd.role,
      adapterType: cmd.adapterType,
      title: cmd.title ?? null,
      reportsTo: cmd.reportsTo ?? null,
      adapterConfig: cmd.adapterConfig ?? {},
      runtimeConfig: cmd.runtimeConfig ?? {},
      budgetMonthlyCents: cmd.budgetMonthlyCents ?? 0,
      permissions: cmd.permissions ?? {},
      status: 'idle',
    });
  }
}
