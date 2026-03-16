import { Entity, Column, Index } from 'typeorm';
import { BaseModel } from './base-model.js';

@Entity('agents')
@Index(['companyId', 'status'])
@Index(['companyId', 'reportsTo'])
export class AgentModel extends BaseModel {
  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  role!: string;

  @Column({ type: 'text', nullable: true })
  title!: string | null;

  @Column({ type: 'text', nullable: true })
  icon!: string | null;

  @Column({ type: 'text', default: 'idle' })
  status!: string;

  @Column({ type: 'uuid', nullable: true })
  reportsTo!: string | null;

  @Column({ type: 'text' })
  adapterType!: string;

  @Column({ type: 'jsonb', default: {} })
  adapterConfig!: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  runtimeConfig!: Record<string, unknown>;

  @Column({ type: 'int', default: 0 })
  budgetMonthlyCents!: number;

  @Column({ type: 'int', default: 0 })
  spentMonthlyCents!: number;

  @Column({ type: 'jsonb', default: {} })
  permissions!: Record<string, unknown>;

  @Column({ type: 'timestamptz', nullable: true })
  lastHeartbeatAt!: Date | null;
}
