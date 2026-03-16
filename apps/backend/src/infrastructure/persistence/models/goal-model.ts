import { Entity, Column, Index } from 'typeorm';
import { BaseModel } from './base-model.js';

@Entity('goals')
@Index(['companyId', 'level'])
export class GoalModel extends BaseModel {
  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'uuid', nullable: true })
  parentId!: string | null;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', default: 'company' })
  level!: string;

  @Column({ type: 'text', default: 'active' })
  status!: string;
}
