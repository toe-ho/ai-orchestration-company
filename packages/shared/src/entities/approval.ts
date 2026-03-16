export interface IApproval {
  id: string;
  companyId: string;
  type: string;
  status: string;
  requestedBy: string | null;
  resolvedBy: string | null;
  details: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}
