/** Published when an agent's monthly spend exceeds its budget — triggers auto-pause */
export class BudgetExceededEvent {
  constructor(
    public readonly agentId: string,
    public readonly companyId: string,
    public readonly budgetCents: number,
    public readonly spentCents: number,
  ) {}
}
