/** Published when an agent's status changes (pause/resume/terminate/error) */
export class AgentStatusChangedEvent {
  constructor(
    public readonly agentId: string,
    public readonly companyId: string,
    public readonly previousStatus: string,
    public readonly newStatus: string,
  ) {}
}
