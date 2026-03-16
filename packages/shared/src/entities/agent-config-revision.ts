export interface IAgentConfigRevision {
  id: string;
  companyId: string;
  agentId: string;
  adapterConfig: Record<string, unknown>;
  runtimeConfig: Record<string, unknown>;
  createdBy: string | null;
  createdAt: Date;
}
