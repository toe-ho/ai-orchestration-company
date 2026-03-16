export interface IAgentApiKey {
  id: string;
  companyId: string;
  agentId: string;
  keyHash: string;
  label: string | null;
  revokedAt: Date | null;
  createdAt: Date;
}
