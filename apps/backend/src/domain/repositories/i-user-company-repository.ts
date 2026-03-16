import type { IUserCompany } from '@aicompany/shared';

export interface IUserCompanyRepository {
  findByUserAndCompany(
    userId: string,
    companyId: string,
  ): Promise<IUserCompany | null>;
  findCompaniesByUser(userId: string): Promise<IUserCompany[]>;
  addMember(
    userId: string,
    companyId: string,
    role: string,
  ): Promise<IUserCompany>;
  removeMember(userId: string, companyId: string): Promise<void>;
  updateRole(
    userId: string,
    companyId: string,
    role: string,
  ): Promise<IUserCompany>;
}

export const USER_COMPANY_REPOSITORY = Symbol('IUserCompanyRepository');
