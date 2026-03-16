import { Entity, Column, Index } from 'typeorm';
import { BaseModel } from './base-model.js';

@Entity('companies')
export class CompanyModel extends BaseModel {
  @Column({ type: 'text' })
  ownerId!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', default: 'active' })
  status!: string;

  @Index({ unique: true })
  @Column({ type: 'text' })
  issuePrefix!: string;

  @Column({ type: 'int', default: 0 })
  issueCounter!: number;

  @Column({ type: 'int', default: 0 })
  budgetMonthlyCents!: number;

  @Column({ type: 'int', default: 0 })
  spentMonthlyCents!: number;

  @Column({ type: 'jsonb', nullable: true })
  runnerConfig!: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  templateId!: string | null;

  @Column({ type: 'text', nullable: true })
  brandColor!: string | null;
}
