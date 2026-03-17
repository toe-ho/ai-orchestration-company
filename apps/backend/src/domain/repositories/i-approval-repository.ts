import type { ApprovalModel } from '../../infrastructure/persistence/models/approval-model.js';

export interface IApprovalRepository {
  create(data: Partial<ApprovalModel>): Promise<ApprovalModel>;
  findById(id: string): Promise<ApprovalModel | null>;
  findByCompany(companyId: string, status?: string): Promise<ApprovalModel[]>;
  update(id: string, partial: Partial<ApprovalModel>): Promise<void>;
}

export const APPROVAL_REPOSITORY = Symbol('IApprovalRepository');
