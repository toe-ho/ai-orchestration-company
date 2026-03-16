import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IIssueCommentRepository } from '../../../../domain/repositories/i-issue-comment-repository.js';
import { ISSUE_COMMENT_REPOSITORY } from '../../../../domain/repositories/i-issue-comment-repository.js';
import type { IIssueComment } from '@aicompany/shared';

export class AddCommentCommand {
  constructor(
    public readonly issueId: string,
    public readonly companyId: string,
    public readonly authorId: string | null,
    public readonly authorType: string,
    public readonly content: string,
  ) {}
}

@CommandHandler(AddCommentCommand)
export class AddCommentHandler implements ICommandHandler<AddCommentCommand, IIssueComment> {
  constructor(
    @Inject(ISSUE_COMMENT_REPOSITORY)
    private readonly commentRepo: IIssueCommentRepository,
  ) {}

  execute(cmd: AddCommentCommand): Promise<IIssueComment> {
    return this.commentRepo.create({
      issueId: cmd.issueId,
      companyId: cmd.companyId,
      authorId: cmd.authorId,
      authorType: cmd.authorType,
      content: cmd.content,
    });
  }
}
