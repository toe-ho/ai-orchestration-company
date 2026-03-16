import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { IIssueRepository } from '../../../domain/repositories/i-issue-repository.js';
import { ISSUE_REPOSITORY } from '../../../domain/repositories/i-issue-repository.js';
import type { IIssue } from '@aicompany/shared';

export class GetIssueQuery {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
  ) {}
}

@QueryHandler(GetIssueQuery)
export class GetIssueHandler implements IQueryHandler<GetIssueQuery, IIssue> {
  constructor(
    @Inject(ISSUE_REPOSITORY) private readonly issueRepo: IIssueRepository,
  ) {}

  async execute(query: GetIssueQuery): Promise<IIssue> {
    const issue = await this.issueRepo.findByIdAndCompany(query.id, query.companyId);
    if (!issue) throw new NotFoundException(`Issue ${query.id} not found`);
    return issue;
  }
}
