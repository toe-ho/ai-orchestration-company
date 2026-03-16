import type { IAgentRuntimeState } from '@aicompany/shared';

export interface IAgentRuntimeStateRepository {
  findByAgent(agentId: string): Promise<IAgentRuntimeState | null>;
  upsert(agentId: string, companyId: string, data: Partial<IAgentRuntimeState>): Promise<IAgentRuntimeState>;
}

export const AGENT_RUNTIME_STATE_REPOSITORY = Symbol('IAgentRuntimeStateRepository');
