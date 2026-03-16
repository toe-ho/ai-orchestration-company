import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IIssueComment } from '@aicompany/shared';
import { IssueCommentModel } from '../persistence/models/issue-comment-model.js';
import type { IIssueCommentRepository } from '../../domain/repositories/i-issue-comment-repository.js';

@Injectable()
export class IssueCommentRepository implements IIssueCommentRepository {
  constructor(
    @InjectRepository(IssueCommentModel)
    private readonly repo: Repository<IssueCommentModel>,
  ) {}

  findAllByIssue(companyId: string, issueId: string): Promise<IIssueComment[]> {
    return this.repo
      .createQueryBuilder('c')
      .where('c.companyId = :companyId', { companyId })
      .andWhere('c.issueId = :issueId', { issueId })
      .orderBy('c.createdAt', 'ASC')
      .getMany();
  }

  async create(comment: Partial<IIssueComment>): Promise<IIssueComment> {
    const entity = this.repo.create({
      companyId: comment.companyId,
      issueId: comment.issueId,
      authorType: comment.authorType,
      authorId: comment.authorId ?? null,
      content: comment.content,
    });
    return this.repo.save(entity);
  }
}
