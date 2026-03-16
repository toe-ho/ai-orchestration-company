import { Entity, Column, Index } from 'typeorm';
import { BaseModel } from './base-model.js';

@Entity('issue_comments')
@Index(['companyId', 'issueId'])
export class IssueCommentModel extends BaseModel {
  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'uuid' })
  issueId!: string;

  /** Maps to IIssueComment.authorType */
  @Column({ type: 'text' })
  authorType!: string;

  /** Maps to IIssueComment.authorId */
  @Column({ type: 'text', nullable: true })
  authorId!: string | null;

  /** Maps to IIssueComment.content */
  @Column({ type: 'text' })
  content!: string;
}
