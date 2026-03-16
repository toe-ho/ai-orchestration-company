import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IIssueRepository } from '../../../domain/repositories/i-issue-repository.js';
import { ISSUE_REPOSITORY } from '../../../domain/repositories/i-issue-repository.js';
import type { IIssue } from '@aicompany/shared';

export class ListIssuesQuery {
  constructor(
    public readonly companyId: string,
    public readonly status?: string,
    public readonly priority?: string,
    public readonly assigneeAgentId?: string,
    public readonly projectId?: string,
    public readonly limit?: number,
    public readonly offset?: number,
  ) {}
}

@QueryHandler(ListIssuesQuery)
export class ListIssuesHandler implements IQueryHandler<ListIssuesQuery, IIssue[]> {
  constructor(
    @Inject(ISSUE_REPOSITORY) private readonly issueRepo: IIssueRepository,
  ) {}

  execute(query: ListIssuesQuery): Promise<IIssue[]> {
    return this.issueRepo.findAllByCompany(query.companyId, {
      status: query.status,
      priority: query.priority,
      assigneeAgentId: query.assigneeAgentId,
      projectId: query.projectId,
      limit: query.limit,
      offset: query.offset,
    });
  }
}
