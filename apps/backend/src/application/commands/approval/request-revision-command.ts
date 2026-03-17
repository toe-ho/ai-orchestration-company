import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { IApprovalRepository } from '../../../domain/repositories/i-approval-repository.js';
import { APPROVAL_REPOSITORY } from '../../../domain/repositories/i-approval-repository.js';

export class RequestRevisionCommand {
  constructor(
    public readonly approvalId: string,
    public readonly companyId: string,
    public readonly requestedByUserId: string,
  ) {}
}

@CommandHandler(RequestRevisionCommand)
export class RequestRevisionHandler implements ICommandHandler<RequestRevisionCommand, void> {
  constructor(
    @Inject(APPROVAL_REPOSITORY) private readonly repo: IApprovalRepository,
  ) {}

  async execute(cmd: RequestRevisionCommand): Promise<void> {
    const approval = await this.repo.findById(cmd.approvalId);
    if (!approval || approval.companyId !== cmd.companyId) {
      throw new NotFoundException(`Approval ${cmd.approvalId} not found`);
    }

    await this.repo.update(cmd.approvalId, {
      status: 'revision_requested',
    });
  }
}
