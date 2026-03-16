import { Entity, Column, Index } from 'typeorm';
import { BaseModel } from './base-model.js';

@Entity('issues')
@Index(['companyId', 'status'])
@Index(['companyId', 'assigneeAgentId', 'status'])
@Index(['identifier'], { unique: true })
export class IssueModel extends BaseModel {
  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'uuid', nullable: true })
  projectId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  goalId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  parentId!: string | null;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', default: 'backlog' })
  status!: string;

  @Column({ type: 'text', default: 'medium' })
  priority!: string;

  @Column({ type: 'uuid', nullable: true })
  assigneeAgentId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  checkoutRunId!: string | null;

  @Column({ type: 'text' })
  identifier!: string;

  @Column({ type: 'int' })
  issueNumber!: number;
}
