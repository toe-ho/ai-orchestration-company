import type { ICompanyVm } from '@aicompany/shared';

export interface ICompanyVmRepository {
  findByCompanyId(companyId: string): Promise<ICompanyVm | null>;
  upsert(companyId: string, data: Partial<ICompanyVm>): Promise<ICompanyVm>;
  updateStatus(companyId: string, status: string): Promise<void>;
  delete(companyId: string): Promise<void>;
}

export const COMPANY_VM_REPOSITORY = Symbol('ICompanyVmRepository');
