import { Entity, Column, Index } from 'typeorm';
import { BaseModel } from './base-model.js';

@Entity('company_vms')
@Index(['companyId'], { unique: true })
export class CompanyVmModel extends BaseModel {
  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'text' })
  machineId!: string;

  @Column({ type: 'text', default: 'stopped' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  region!: string | null;

  @Column({ type: 'text', nullable: true })
  size!: string | null;

  @Column({ type: 'text', nullable: true })
  volumeId!: string | null;

  @Column({ type: 'text', nullable: true })
  privateIp!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastActiveAt!: Date | null;
}
