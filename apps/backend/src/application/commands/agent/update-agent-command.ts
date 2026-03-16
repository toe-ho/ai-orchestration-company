import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { IAgentRepository } from '../../../domain/repositories/i-agent-repository.js';
import { AGENT_REPOSITORY } from '../../../domain/repositories/i-agent-repository.js';
import type { IAgent } from '@aicompany/shared';

export class UpdateAgentCommand {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly partial: Partial<IAgent>,
  ) {}
}

@CommandHandler(UpdateAgentCommand)
export class UpdateAgentHandler implements ICommandHandler<UpdateAgentCommand, IAgent> {
  constructor(
    @Inject(AGENT_REPOSITORY) private readonly agentRepo: IAgentRepository,
  ) {}

  async execute(cmd: UpdateAgentCommand): Promise<IAgent> {
    const updated = await this.agentRepo.update(cmd.id, cmd.partial);
    if (!updated) throw new NotFoundException(`Agent ${cmd.id} not found`);
    return updated;
  }
}
