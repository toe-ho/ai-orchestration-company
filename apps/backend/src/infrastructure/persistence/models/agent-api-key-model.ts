import { Entity, Column, Index } from 'typeorm';
import { BaseModel } from './base-model.js';

@Entity('agent_api_keys')
@Index(['companyId', 'agentId'])
export class AgentApiKeyModel extends BaseModel {
  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'uuid' })
  agentId!: string;

  /** SHA-256 hex digest of the raw pcp_-prefixed key */
  @Column({ type: 'text', unique: true })
  keyHash!: string;

  @Column({ type: 'text', nullable: true })
  label!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;
}
