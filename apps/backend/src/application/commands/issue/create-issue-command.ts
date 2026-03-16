import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { IIssueRepository } from '../../../domain/repositories/i-issue-repository.js';
import { ISSUE_REPOSITORY } from '../../../domain/repositories/i-issue-repository.js';
import type { ICompanyRepository } from '../../../domain/repositories/i-company-repository.js';
import { COMPANY_REPOSITORY } from '../../../domain/repositories/i-company-repository.js';
import type { IIssue } from '@aicompany/shared';

export class CreateIssueCommand {
  constructor(
    public readonly companyId: string,
    public readonly title: string,
    public readonly projectId?: string,
    public readonly goalId?: string,
    public readonly parentId?: string,
    public readonly description?: string,
    public readonly priority?: string,
    public readonly status?: string,
    public readonly assigneeAgentId?: string,
  ) {}
}

@CommandHandler(CreateIssueCommand)
export class CreateIssueHandler implements ICommandHandler<CreateIssueCommand, IIssue> {
  constructor(
    @Inject(ISSUE_REPOSITORY) private readonly issueRepo: IIssueRepository,
    @Inject(COMPANY_REPOSITORY) private readonly companyRepo: ICompanyRepository,
  ) {}

  async execute(cmd: CreateIssueCommand): Promise<IIssue> {
    const company = await this.companyRepo.findById(cmd.companyId);
    if (!company) throw new NotFoundException(`Company ${cmd.companyId} not found`);

    const counter = await this.companyRepo.incrementIssueCounter(cmd.companyId);
    const identifier = `${company.issuePrefix}-${counter}`;

    return this.issueRepo.create({
      companyId: cmd.companyId,
      title: cmd.title,
      identifier,
      issueNumber: counter,
      status: cmd.status ?? 'backlog',
      priority: cmd.priority ?? 'medium',
      projectId: cmd.projectId ?? null,
      goalId: cmd.goalId ?? null,
      parentId: cmd.parentId ?? null,
      description: cmd.description ?? null,
      assigneeAgentId: cmd.assigneeAgentId ?? null,
    });
  }
}
