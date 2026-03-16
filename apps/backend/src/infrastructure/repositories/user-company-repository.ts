import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IUserCompany } from '@aicompany/shared';
import { UserCompanyModel } from '../persistence/models/user-company-model.js';
import {
  IUserCompanyRepository,
  USER_COMPANY_REPOSITORY,
} from '../../domain/repositories/i-user-company-repository.js';

export { USER_COMPANY_REPOSITORY };

@Injectable()
export class UserCompanyRepository implements IUserCompanyRepository {
  constructor(
    @InjectRepository(UserCompanyModel)
    private readonly repo: Repository<UserCompanyModel>,
  ) {}

  findByUserAndCompany(
    userId: string,
    companyId: string,
  ): Promise<IUserCompany | null> {
    return this.repo.findOneBy({ userId, companyId });
  }

  findCompaniesByUser(userId: string): Promise<IUserCompany[]> {
    return this.repo.findBy({ userId });
  }

  async addMember(
    userId: string,
    companyId: string,
    role: string,
  ): Promise<IUserCompany> {
    const entity = this.repo.create({ userId, companyId, role });
    return this.repo.save(entity);
  }

  async removeMember(userId: string, companyId: string): Promise<void> {
    await this.repo.delete({ userId, companyId });
  }

  async updateRole(
    userId: string,
    companyId: string,
    role: string,
  ): Promise<IUserCompany> {
    await this.repo.update({ userId, companyId }, { role });
    const updated = await this.repo.findOneBy({ userId, companyId });
    if (!updated) throw new Error('UserCompany not found after update');
    return updated;
  }
}
