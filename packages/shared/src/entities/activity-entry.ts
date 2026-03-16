export interface IActivityEntry {
  id: string;
  companyId: string;
  actorType: string;
  actorId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  runId: string | null;
  details: Record<string, unknown> | null;
  createdAt: Date;
}
