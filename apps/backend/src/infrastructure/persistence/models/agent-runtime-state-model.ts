import { Entity, Column, Index } from 'typeorm';
import { BaseModel } from './base-model.js';

@Entity('agent_runtime_states')
@Index(['companyId', 'agentId'], { unique: true })
export class AgentRuntimeStateModel extends BaseModel {
  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'uuid' })
  agentId!: string;

  @Column({ type: 'uuid', nullable: true })
  currentRunId!: string | null;

  @Column({ type: 'int', default: 0 })
  cumulativeInputTokens!: number;

  @Column({ type: 'int', default: 0 })
  cumulativeOutputTokens!: number;

  @Column({ type: 'int', default: 0 })
  cumulativeCostCents!: number;
}
