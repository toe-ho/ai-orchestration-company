import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { IIssueRepository } from '../../../domain/repositories/i-issue-repository.js';
import { ISSUE_REPOSITORY } from '../../../domain/repositories/i-issue-repository.js';
import { IssueAlreadyCheckedOutException } from '../../../domain/exceptions/issue-already-checked-out-exception.js';
import type { ICompanyEventPublisher } from '../../../application/services/interface/i-company-event-publisher.js';
import { COMPANY_EVENT_PUBLISHER } from '../../../application/services/interface/i-company-event-publisher.js';

export class CheckoutIssueCommand {
  constructor(
    public readonly issueId: string,
    public readonly companyId: string,
    public readonly runId: string,
  ) {}
}

@CommandHandler(CheckoutIssueCommand)
export class CheckoutIssueHandler implements ICommandHandler<CheckoutIssueCommand, void> {
  constructor(
    @Inject(ISSUE_REPOSITORY) private readonly issueRepo: IIssueRepository,
    @Inject(COMPANY_EVENT_PUBLISHER) private readonly publisher: ICompanyEventPublisher,
  ) {}

  async execute(cmd: CheckoutIssueCommand): Promise<void> {
    const existing = await this.issueRepo.findByIdAndCompany(cmd.issueId, cmd.companyId);
    if (!existing) throw new NotFoundException(`Issue ${cmd.issueId} not found`);
    const success = await this.issueRepo.atomicCheckout(cmd.issueId, cmd.runId);
    if (!success) throw new IssueAlreadyCheckedOutException(cmd.issueId);
    await this.publisher.publishCompanyEvent(cmd.companyId, {
      type: 'issue.checked_out',
      data: { issueId: cmd.issueId, runId: cmd.runId },
      timestamp: new Date().toISOString(),
    });
  }
}
