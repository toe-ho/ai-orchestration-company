import { Entity, Column, Index, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

/** Records token usage and cost for a single agent heartbeat run */
@Entity('cost_events')
@Index(['companyId', 'createdAt'])
export class CostEventModel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'uuid' })
  agentId!: string;

  @Column({ type: 'uuid', nullable: true })
  runId!: string | null;

  @Column({ type: 'text' })
  provider!: string;

  @Column({ type: 'text' })
  model!: string;

  @Column({ type: 'int', default: 0 })
  inputTokens!: number;

  @Column({ type: 'int', default: 0 })
  outputTokens!: number;

  @Column({ type: 'int', default: 0 })
  costCents!: number;

  @Column({ type: 'int', default: 0 })
  computeCostCents!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
