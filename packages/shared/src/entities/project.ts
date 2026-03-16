export interface IProject {
  id: string;
  companyId: string;
  goalId: string | null;
  name: string;
  description: string | null;
  status: string;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
