import { Entity, Column, Index } from 'typeorm';
import { BaseModel } from './base-model.js';

@Entity('user_companies')
@Index(['userId', 'companyId'], { unique: true })
export class UserCompanyModel extends BaseModel {
  @Column({ type: 'text' })
  userId!: string;

  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'text', default: 'member' })
  role!: string;
}
