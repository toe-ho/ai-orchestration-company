export interface ICompanyTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  agentConfigs: Record<string, unknown>;
  goalTemplate: string | null;
  isPublic: boolean;
  createdAt: Date;
}
