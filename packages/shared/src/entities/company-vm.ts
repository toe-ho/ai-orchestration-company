export interface ICompanyVm {
  id: string;
  companyId: string;
  machineId: string;
  status: string;
  region: string | null;
  size: string | null;
  volumeId: string | null;
  lastActiveAt: Date | null;
  createdAt: Date;
}
