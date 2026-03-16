export interface IIssue {
  id: string;
  companyId: string;
  projectId: string | null;
  goalId: string | null;
  parentId: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigneeAgentId: string | null;
  checkoutRunId: string | null;
  identifier: string;
  issueNumber: number;
  createdAt: Date;
  updatedAt: Date;
}
