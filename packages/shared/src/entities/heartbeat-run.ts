export interface IHeartbeatRun {
  id: string;
  companyId: string;
  agentId: string;
  vmMachineId: string | null;
  invocationSource: string;
  status: string;
  startedAt: Date | null;
  finishedAt: Date | null;
  exitCode: number | null;
  inputTokens: number;
  outputTokens: number;
  totalCostCents: number;
  model: string | null;
  durationMs: number | null;
  usageJson: Record<string, unknown> | null;
  resultJson: Record<string, unknown> | null;
  computeCostCents: number;
  stdoutExcerpt: string | null;
  createdAt: Date;
  updatedAt: Date;
}
