import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { IAgentRepository } from '../../../domain/repositories/i-agent-repository.js';
import { AGENT_REPOSITORY } from '../../../domain/repositories/i-agent-repository.js';
import type { ICompanyEventPublisher } from '../../../application/services/interface/i-company-event-publisher.js';
import { COMPANY_EVENT_PUBLISHER } from '../../../application/services/interface/i-company-event-publisher.js';
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
    @Inject(COMPANY_EVENT_PUBLISHER) private readonly publisher: ICompanyEventPublisher,
  ) {}

  async execute(cmd: ResumeAgentCommand): Promise<IAgent> {
    const existing = await this.agentRepo.findByIdAndCompany(cmd.id, cmd.companyId);
    if (!existing) throw new NotFoundException(`Agent ${cmd.id} not found`);
    const updated = await this.agentRepo.update(cmd.id, { status: 'idle' });
    await this.publisher.publishCompanyEvent(cmd.companyId, {
      type: 'agent.status_changed',
      data: { agentId: cmd.id, status: 'idle' },
      timestamp: new Date().toISOString(),
    });
    return updated!;
  }
}
