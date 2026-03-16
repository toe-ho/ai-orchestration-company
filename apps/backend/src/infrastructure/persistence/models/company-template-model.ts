import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('company_templates')
export class CompanyTemplateModel {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', nullable: true })
  category!: string | null;

  @Column({ type: 'jsonb', default: {} })
  agentConfigs!: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  goalTemplate!: string | null;

  @Column({ type: 'boolean', default: false })
  isPublic!: boolean;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}
