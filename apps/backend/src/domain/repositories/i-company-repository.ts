import type { ICompany } from '@aicompany/shared';

export interface ICompanyRepository {
  findById(id: string): Promise<ICompany | null>;
  findByIdAndOwner(id: string, ownerId: string): Promise<ICompany | null>;
  findAllByUser(userId: string): Promise<ICompany[]>;
  create(data: Partial<ICompany>): Promise<ICompany>;
  update(id: string, partial: Partial<ICompany>): Promise<ICompany | null>;
  softDelete(id: string): Promise<void>;
  /** Atomically increments issueCounter and returns the new value */
  incrementIssueCounter(id: string): Promise<number>;
}

export const COMPANY_REPOSITORY = Symbol('ICompanyRepository');
