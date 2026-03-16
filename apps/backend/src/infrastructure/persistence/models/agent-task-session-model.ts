import { Entity, Column, Index } from 'typeorm';
import { BaseModel } from './base-model.js';

@Entity('agent_task_sessions')
@Index(['companyId', 'agentId', 'issueId'], { unique: true })
export class AgentTaskSessionModel extends BaseModel {
  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'uuid' })
  agentId!: string;

  @Column({ type: 'uuid' })
  issueId!: string;

  @Column({ type: 'jsonb', default: {} })
  sessionData!: Record<string, unknown>;
}
