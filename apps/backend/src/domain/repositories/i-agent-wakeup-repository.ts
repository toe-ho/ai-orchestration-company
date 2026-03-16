import type { IAgentWakeupRequest } from '@aicompany/shared';

export interface IAgentWakeupRepository {
  create(data: Partial<IAgentWakeupRequest>): Promise<IAgentWakeupRequest>;
  /** Find unprocessed wakeup requests for an agent created within the window */
  findPendingWithinWindow(agentId: string, windowMs: number): Promise<IAgentWakeupRequest[]>;
  markProcessed(id: string): Promise<void>;
}

export const AGENT_WAKEUP_REPOSITORY = Symbol('IAgentWakeupRepository');
