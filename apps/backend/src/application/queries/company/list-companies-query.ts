import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { ICompanyRepository } from '../../../domain/repositories/i-company-repository.js';
import { COMPANY_REPOSITORY } from '../../../domain/repositories/i-company-repository.js';
import type { ICompany } from '@aicompany/shared';

export class ListCompaniesQuery {
  constructor(public readonly userId: string) {}
}

@QueryHandler(ListCompaniesQuery)
export class ListCompaniesHandler implements IQueryHandler<ListCompaniesQuery, ICompany[]> {
  constructor(
    @Inject(COMPANY_REPOSITORY) private readonly companyRepo: ICompanyRepository,
  ) {}

  execute(query: ListCompaniesQuery): Promise<ICompany[]> {
    return this.companyRepo.findAllByUser(query.userId);
  }
}
