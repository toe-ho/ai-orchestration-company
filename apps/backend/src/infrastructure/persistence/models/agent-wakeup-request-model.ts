import { Entity, Column, Index } from 'typeorm';
import { BaseModel } from './base-model.js';

@Entity('agent_wakeup_requests')
@Index(['companyId', 'agentId', 'processedAt'])
export class AgentWakeupRequestModel extends BaseModel {
  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'uuid' })
  agentId!: string;

  @Column({ type: 'text' })
  source!: string;

  @Column({ type: 'jsonb', nullable: true })
  payload!: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt!: Date | null;
}
