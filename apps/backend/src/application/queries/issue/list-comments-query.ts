import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IIssueCommentRepository } from '../../../domain/repositories/i-issue-comment-repository.js';
import { ISSUE_COMMENT_REPOSITORY } from '../../../domain/repositories/i-issue-comment-repository.js';
import type { IIssueComment } from '@aicompany/shared';

export class ListCommentsQuery {
  constructor(
    public readonly issueId: string,
    public readonly companyId: string,
  ) {}
}

@QueryHandler(ListCommentsQuery)
export class ListCommentsHandler implements IQueryHandler<ListCommentsQuery, IIssueComment[]> {
  constructor(
    @Inject(ISSUE_COMMENT_REPOSITORY) private readonly commentRepo: IIssueCommentRepository,
  ) {}

  execute(query: ListCommentsQuery): Promise<IIssueComment[]> {
    return this.commentRepo.findAllByIssue(query.companyId, query.issueId);
  }
}
