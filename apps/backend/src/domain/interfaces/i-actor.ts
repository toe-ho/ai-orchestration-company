import { ActorType } from '@aicompany/shared';

/** Unified actor type attached to every request by auth guards */
export interface IActor {
  type: ActorType;
  userId?: string;
  agentId?: string;
  companyId?: string;
  runId?: string;
}
