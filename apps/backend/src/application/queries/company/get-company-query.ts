import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { ICompanyRepository } from '../../../domain/repositories/i-company-repository.js';
import { COMPANY_REPOSITORY } from '../../../domain/repositories/i-company-repository.js';
import type { IUserCompanyRepository } from '../../../domain/repositories/i-user-company-repository.js';
import { USER_COMPANY_REPOSITORY } from '../../../domain/repositories/i-user-company-repository.js';
import type { ICompany } from '@aicompany/shared';

export class GetCompanyQuery {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}

@QueryHandler(GetCompanyQuery)
export class GetCompanyHandler implements IQueryHandler<GetCompanyQuery, ICompany> {
  constructor(
    @Inject(COMPANY_REPOSITORY) private readonly companyRepo: ICompanyRepository,
    @Inject(USER_COMPANY_REPOSITORY) private readonly userCompanyRepo: IUserCompanyRepository,
  ) {}

  async execute(query: GetCompanyQuery): Promise<ICompany> {
    const company = await this.companyRepo.findById(query.id);
    if (!company) throw new NotFoundException(`Company ${query.id} not found`);
    const membership = await this.userCompanyRepo.findByUserAndCompany(query.userId, query.id);
    if (!membership) throw new ForbiddenException('Access denied');
    return company;
  }
}
