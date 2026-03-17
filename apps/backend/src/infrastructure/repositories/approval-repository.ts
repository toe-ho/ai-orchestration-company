import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalModel } from '../persistence/models/approval-model.js';
import type { IApprovalRepository } from '../../domain/repositories/i-approval-repository.js';

@Injectable()
export class ApprovalRepository implements IApprovalRepository {
  constructor(
    @InjectRepository(ApprovalModel)
    private readonly repo: Repository<ApprovalModel>,
  ) {}

  async create(data: Partial<ApprovalModel>): Promise<ApprovalModel> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  findById(id: string): Promise<ApprovalModel | null> {
    return this.repo.findOneBy({ id });
  }

  findByCompany(companyId: string, status?: string): Promise<ApprovalModel[]> {
    const qb = this.repo
      .createQueryBuilder('a')
      .where('a.companyId = :companyId', { companyId })
      .orderBy(`CASE WHEN a.status = 'pending' THEN 0 ELSE 1 END`, 'ASC')
      .addOrderBy('a.createdAt', 'DESC');

    if (status) {
      qb.andWhere('a.status = :status', { status });
    }

    return qb.getMany();
  }

  async update(id: string, partial: Partial<ApprovalModel>): Promise<void> {
    await this.repo.update(id, partial as never);
  }
}
