import { Entity, Column, Index } from 'typeorm';
import { BaseModel } from './base-model.js';

@Entity('heartbeat_runs')
@Index(['companyId', 'agentId', 'startedAt'])
export class HeartbeatRunModel extends BaseModel {
  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'uuid' })
  agentId!: string;

  @Column({ type: 'text', nullable: true })
  vmMachineId!: string | null;

  @Column({ type: 'text', default: 'on_demand' })
  invocationSource!: string;

  @Column({ type: 'text', default: 'queued' })
  status!: string;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt!: Date | null;

  @Column({ type: 'int', nullable: true })
  exitCode!: number | null;

  @Column({ type: 'int', default: 0 })
  inputTokens!: number;

  @Column({ type: 'int', default: 0 })
  outputTokens!: number;

  @Column({ type: 'int', default: 0 })
  totalCostCents!: number;

  @Column({ type: 'text', nullable: true })
  model!: string | null;

  @Column({ type: 'int', nullable: true })
  durationMs!: number | null;

  @Column({ type: 'jsonb', nullable: true })
  usageJson!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  resultJson!: Record<string, unknown> | null;

  @Column({ type: 'int', default: 0 })
  computeCostCents!: number;

  @Column({ type: 'text', nullable: true })
  stdoutExcerpt!: string | null;
}
