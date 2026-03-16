export interface IAgentRuntimeState {
  id: string;
  companyId: string;
  agentId: string;
  currentRunId: string | null;
  cumulativeInputTokens: number;
  cumulativeOutputTokens: number;
  cumulativeCostCents: number;
  updatedAt: Date;
}
