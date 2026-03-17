import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IApprovalRepository } from '../../../domain/repositories/i-approval-repository.js';
import { APPROVAL_REPOSITORY } from '../../../domain/repositories/i-approval-repository.js';
import type { ApprovalModel } from '../../../infrastructure/persistence/models/approval-model.js';

export class CreateApprovalCommand {
  constructor(
    public readonly companyId: string,
    public readonly type: string,
    public readonly title: string,
    public readonly description: string,
    public readonly details?: Record<string, unknown>,
    public readonly requestedByAgentId?: string,
    public readonly requestedByUserId?: string,
  ) {}
}

@CommandHandler(CreateApprovalCommand)
export class CreateApprovalHandler implements ICommandHandler<CreateApprovalCommand, ApprovalModel> {
  constructor(
    @Inject(APPROVAL_REPOSITORY) private readonly repo: IApprovalRepository,
  ) {}

  execute(cmd: CreateApprovalCommand): Promise<ApprovalModel> {
    return this.repo.create({
      companyId: cmd.companyId,
      type: cmd.type,
      status: 'pending',
      title: cmd.title,
      description: cmd.description,
      details: cmd.details ?? null,
      requestedByAgentId: cmd.requestedByAgentId ?? null,
      requestedByUserId: cmd.requestedByUserId ?? null,
    });
  }
}
