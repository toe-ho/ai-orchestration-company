/** Published when an approval is resolved (approved or rejected) */
export class ApprovalResolvedEvent {
  constructor(
    public readonly approvalId: string,
    public readonly companyId: string,
    public readonly type: string,
    public readonly status: string,
    public readonly details: Record<string, unknown> | null,
    public readonly resolvedByUserId: string,
  ) {}
}
