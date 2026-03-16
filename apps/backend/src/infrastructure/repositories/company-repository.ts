import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ICompany } from '@aicompany/shared';
import { CompanyModel } from '../persistence/models/company-model.js';
import { UserCompanyModel } from '../persistence/models/user-company-model.js';
import type { ICompanyRepository } from '../../domain/repositories/i-company-repository.js';
import { BaseRepository } from './base-repository.js';

@Injectable()
export class CompanyRepository
  extends BaseRepository<CompanyModel>
  implements ICompanyRepository
{
  constructor(
    @InjectRepository(CompanyModel)
    repo: Repository<CompanyModel>,
    @InjectRepository(UserCompanyModel)
    private readonly userCompanyRepo: Repository<UserCompanyModel>,
  ) {
    super(repo);
  }

  findByIdAndOwner(id: string, ownerId: string): Promise<ICompany | null> {
    return this.repo.findOneBy({ id, ownerId });
  }

  async findAllByUser(userId: string): Promise<ICompany[]> {
    const memberships = await this.userCompanyRepo.findBy({ userId });
    if (!memberships.length) return [];
    const companyIds = memberships.map((m) => m.companyId);
    return this.repo
      .createQueryBuilder('c')
      .where('c.id IN (:...companyIds)', { companyIds })
      .getMany();
  }

  async incrementIssueCounter(id: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .update(CompanyModel)
      .set({ issueCounter: () => 'issue_counter + 1' })
      .where('id = :id', { id })
      .returning('issue_counter')
      .execute();
    const raw = result.raw as Array<{ issue_counter: number }>;
    return raw[0]?.issue_counter ?? 0;
  }
}
