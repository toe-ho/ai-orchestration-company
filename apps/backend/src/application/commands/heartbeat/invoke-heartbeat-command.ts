/** Triggers a full heartbeat lifecycle for an agent (10 steps) */
export class InvokeHeartbeatCommand {
  constructor(
    public readonly agentId: string,
    public readonly companyId: string,
    public readonly invocationSource: string = 'on_demand',
  ) {}
}
