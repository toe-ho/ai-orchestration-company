export interface ICompany {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  status: string;
  issuePrefix: string;
  issueCounter: number;
  budgetMonthlyCents: number;
  spentMonthlyCents: number;
  runnerConfig: Record<string, unknown> | null;
  templateId: string | null;
  brandColor: string | null;
  createdAt: Date;
  updatedAt: Date;
}
