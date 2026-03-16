import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { IIssueRepository } from '../../../domain/repositories/i-issue-repository.js';
import { ISSUE_REPOSITORY } from '../../../domain/repositories/i-issue-repository.js';

export class ReleaseIssueCommand {
  constructor(
    public readonly issueId: string,
    public readonly companyId: string,
    public readonly runId: string,
  ) {}
}

@CommandHandler(ReleaseIssueCommand)
export class ReleaseIssueHandler implements ICommandHandler<ReleaseIssueCommand, void> {
  constructor(
    @Inject(ISSUE_REPOSITORY) private readonly issueRepo: IIssueRepository,
  ) {}

  async execute(cmd: ReleaseIssueCommand): Promise<void> {
    const existing = await this.issueRepo.findByIdAndCompany(cmd.issueId, cmd.companyId);
    if (!existing) throw new NotFoundException(`Issue ${cmd.issueId} not found`);
    const released = await this.issueRepo.release(cmd.issueId, cmd.runId);
    if (!released) throw new ForbiddenException(`Run ${cmd.runId} does not own issue ${cmd.issueId}`);
  }
}
