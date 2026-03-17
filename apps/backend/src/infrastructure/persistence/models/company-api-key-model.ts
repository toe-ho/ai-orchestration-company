import { Entity, Column, Index } from 'typeorm';
import { BaseModel } from './base-model.js';

@Entity('company_api_keys')
@Index(['companyId', 'provider'])
export class CompanyApiKeyModel extends BaseModel {
  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'text' })
  provider!: string;

  @Column({ type: 'text' })
  encryptedKey!: string;

  @Column({ type: 'text' })
  keyHash!: string;

  @Column({ type: 'text', nullable: true })
  label!: string | null;

  @Column({ type: 'boolean', default: false })
  isValid!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastValidatedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  maskedKey!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;
}
