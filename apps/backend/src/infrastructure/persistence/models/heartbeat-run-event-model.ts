import { Entity, Column, Index, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('heartbeat_run_events')
@Index(['runId', 'seq'])
export class HeartbeatRunEventModel {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ type: 'uuid' })
  runId!: string;

  @Column({ type: 'int' })
  seq!: number;

  @Column({ type: 'text' })
  eventType!: string;

  @Column({ type: 'text', nullable: true })
  stream!: string | null;

  @Column({ type: 'text', nullable: true })
  message!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payload!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
