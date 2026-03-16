export interface ICostEvent {
  id: string;
  companyId: string;
  agentId: string | null;
  runId: string | null;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costCents: number;
  computeCostCents: number;
  createdAt: Date;
}
