/** Published when a heartbeat run finishes (succeeded, failed, timed_out, cancelled) */
export class HeartbeatRunCompletedEvent {
  constructor(
    public readonly runId: string,
    public readonly agentId: string,
    public readonly companyId: string,
    public readonly status: string,
    public readonly inputTokens: number,
    public readonly outputTokens: number,
    public readonly totalCostCents: number,
  ) {}
}
