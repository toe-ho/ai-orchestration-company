import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { IAgentRepository } from '../../../domain/repositories/i-agent-repository.js';
import { AGENT_REPOSITORY } from '../../../domain/repositories/i-agent-repository.js';
import type { IAgent } from '@aicompany/shared';

export class ResumeAgentCommand {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
  ) {}
}

@CommandHandler(ResumeAgentCommand)
export class ResumeAgentHandler implements ICommandHandler<ResumeAgentCommand, IAgent> {
  constructor(
    @Inject(AGENT_REPOSITORY) private readonly agentRepo: IAgentRepository,
  ) {}

  async execute(cmd: ResumeAgentCommand): Promise<IAgent> {
    const existing = await this.agentRepo.findByIdAndCompany(cmd.id, cmd.companyId);
    if (!existing) throw new NotFoundException(`Agent ${cmd.id} not found`);
    const updated = await this.agentRepo.update(cmd.id, { status: 'idle' });
    return updated!;
  }
}
