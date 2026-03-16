export interface IAgentWakeupRequest {
  id: string;
  companyId: string;
  agentId: string;
  source: string;
  payload: Record<string, unknown> | null;
  processedAt: Date | null;
  createdAt: Date;
}
