export interface IGoal {
  id: string;
  companyId: string;
  parentId: string | null;
  title: string;
  description: string | null;
  level: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
