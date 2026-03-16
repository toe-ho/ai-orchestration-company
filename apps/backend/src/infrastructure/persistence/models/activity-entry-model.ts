import { Entity, Column, Index } from 'typeorm';
import { BaseModel } from './base-model.js';

@Entity('activity_entries')
@Index(['companyId', 'entityType', 'entityId'])
export class ActivityEntryModel extends BaseModel {
  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'text', nullable: true })
  actorId!: string | null;

  @Column({ type: 'text' })
  actorType!: string;

  @Column({ type: 'text' })
  action!: string;

  @Column({ type: 'text', nullable: true })
  entityType!: string | null;

  @Column({ type: 'text', nullable: true })
  entityId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  runId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  details!: Record<string, unknown> | null;
}
