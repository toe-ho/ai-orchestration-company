import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { IApprovalRepository } from '../../../domain/repositories/i-approval-repository.js';
import { APPROVAL_REPOSITORY } from '../../../domain/repositories/i-approval-repository.js';
import { ApprovalResolvedEvent } from '../../events/approval-resolved-event.js';

export class RejectCommand {
  constructor(
    public readonly approvalId: string,
    public readonly companyId: string,
    public readonly resolvedByUserId: string,
  ) {}
}

@CommandHandler(RejectCommand)
export class RejectHandler implements ICommandHandler<RejectCommand, void> {
  constructor(
    @Inject(APPROVAL_REPOSITORY) private readonly repo: IApprovalRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: RejectCommand): Promise<void> {
    const approval = await this.repo.findById(cmd.approvalId);
    if (!approval || approval.companyId !== cmd.companyId) {
      throw new NotFoundException(`Approval ${cmd.approvalId} not found`);
    }

    await this.repo.update(cmd.approvalId, {
      status: 'rejected',
      resolvedByUserId: cmd.resolvedByUserId,
      resolvedAt: new Date(),
    });

    this.eventBus.publish(
      new ApprovalResolvedEvent(
        cmd.approvalId,
        cmd.companyId,
        approval.type,
        'rejected',
        approval.details,
        cmd.resolvedByUserId,
      ),
    );
  }
}
