export interface IAgentTaskSession {
  id: string;
  companyId: string;
  agentId: string;
  issueId: string;
  sessionData: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
