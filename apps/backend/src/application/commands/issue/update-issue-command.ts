import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { IIssueRepository } from '../../../domain/repositories/i-issue-repository.js';
import { ISSUE_REPOSITORY } from '../../../domain/repositories/i-issue-repository.js';
import type { IIssue } from '@aicompany/shared';

export class UpdateIssueCommand {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly partial: Partial<IIssue>,
  ) {}
}

@CommandHandler(UpdateIssueCommand)
export class UpdateIssueHandler implements ICommandHandler<UpdateIssueCommand, IIssue> {
  constructor(
    @Inject(ISSUE_REPOSITORY) private readonly issueRepo: IIssueRepository,
  ) {}

  async execute(cmd: UpdateIssueCommand): Promise<IIssue> {
    const existing = await this.issueRepo.findByIdAndCompany(cmd.id, cmd.companyId);
    if (!existing) throw new NotFoundException(`Issue ${cmd.id} not found`);
    const updated = await this.issueRepo.update(cmd.id, cmd.partial);
    return updated!;
  }
}
