import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ICompanyVm } from '@aicompany/shared';
import { CompanyVmModel } from '../persistence/models/company-vm-model.js';
import type { ICompanyVmRepository } from '../../domain/repositories/i-company-vm-repository.js';

@Injectable()
export class CompanyVmRepository implements ICompanyVmRepository {
  constructor(
    @InjectRepository(CompanyVmModel)
    private readonly repo: Repository<CompanyVmModel>,
  ) {}

  findByCompanyId(companyId: string): Promise<ICompanyVm | null> {
    return this.repo.findOneBy({ companyId });
  }

  async upsert(companyId: string, data: Partial<ICompanyVm>): Promise<ICompanyVm> {
    const existing = await this.findByCompanyId(companyId);
    if (existing) {
      await this.repo.update(existing.id, data as never);
      return (await this.findByCompanyId(companyId))!;
    }
    const entity = this.repo.create({ companyId, ...data } as CompanyVmModel);
    return this.repo.save(entity);
  }

  async updateStatus(companyId: string, status: string): Promise<void> {
    await this.repo.update({ companyId }, { status } as never);
  }

  async delete(companyId: string): Promise<void> {
    await this.repo.delete({ companyId });
  }
}
