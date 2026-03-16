import type { IIssueComment } from '@aicompany/shared';

export interface IIssueCommentRepository {
  findAllByIssue(companyId: string, issueId: string): Promise<IIssueComment[]>;
  create(comment: Partial<IIssueComment>): Promise<IIssueComment>;
}

export const ISSUE_COMMENT_REPOSITORY = Symbol('IIssueCommentRepository');
