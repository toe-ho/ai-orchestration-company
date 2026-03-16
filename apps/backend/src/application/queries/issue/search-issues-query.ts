import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IIssueRepository } from '../../../domain/repositories/i-issue-repository.js';
import { ISSUE_REPOSITORY } from '../../../domain/repositories/i-issue-repository.js';
import type { IIssue } from '@aicompany/shared';

export class SearchIssuesQuery {
  constructor(
    public readonly companyId: string,
    public readonly q: string,
    public readonly limit?: number,
  ) {}
}

@QueryHandler(SearchIssuesQuery)
export class SearchIssuesHandler implements IQueryHandler<SearchIssuesQuery, IIssue[]> {
  constructor(
    @Inject(ISSUE_REPOSITORY) private readonly issueRepo: IIssueRepository,
  ) {}

  execute(query: SearchIssuesQuery): Promise<IIssue[]> {
    return this.issueRepo.searchByTitle(query.companyId, query.q, query.limit);
  }
}
