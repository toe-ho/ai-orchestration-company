import type { ICompanyVm } from '@aicompany/shared';

/** Manages VM lifecycle for a company's executor */
export interface IProvisionerService {
  /** Ensure a VM exists and is running — boots or wakes if needed */
  ensureVm(companyId: string): Promise<ICompanyVm>;
  /** Stop (hibernate) a running VM */
  hibernateVm(companyId: string): Promise<void>;
  /** Permanently destroy a VM and remove its record */
  destroyVm(companyId: string): Promise<void>;
}

export const PROVISIONER_SERVICE = Symbol('IProvisionerService');
