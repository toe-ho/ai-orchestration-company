export interface IExecutionRequest {
  runId: string;
  companyId: string;
  agentId: string;
  agentJwt: string;
  controlPlaneUrl: string;
  adapterType: string;
  adapterConfig: Record<string, unknown>;
  sessionData: Record<string, unknown> | null;
  contextJson: Record<string, unknown>;
  envVars: Record<string, string>;
  timeoutSec: number;
}
