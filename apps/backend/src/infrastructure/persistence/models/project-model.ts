import { Entity, Column, Index } from 'typeorm';
import { BaseModel } from './base-model.js';

@Entity('projects')
@Index(['companyId', 'status'])
export class ProjectModel extends BaseModel {
  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'uuid', nullable: true })
  goalId!: string | null;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', default: 'active' })
  status!: string;

  @Column({ type: 'timestamptz', nullable: true })
  archivedAt!: Date | null;
}
