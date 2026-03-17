import { Entity, Column, Index, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/** Board approval record — create/approve/reject/request-revision workflow */
@Entity('approvals')
@Index(['companyId', 'status'])
export class ApprovalModel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'text' })
  type!: string;

  @Column({ type: 'text', default: 'pending' })
  status!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'jsonb', nullable: true })
  details!: Record<string, unknown> | null;

  @Column({ type: 'uuid', nullable: true })
  requestedByAgentId!: string | null;

  @Column({ type: 'text', nullable: true })
  requestedByUserId!: string | null;

  @Column({ type: 'text', nullable: true })
  resolvedByUserId!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
