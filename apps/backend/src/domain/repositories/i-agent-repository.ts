import type { IAgent } from '@aicompany/shared';

export interface AgentFilters {
  status?: string;
}

export interface IAgentRepository {
  findById(id: string): Promise<IAgent | null>;
  findByIdAndCompany(id: string, companyId: string): Promise<IAgent | null>;
  findAllByCompany(companyId: string, filters?: AgentFilters): Promise<IAgent[]>;
  create(data: Partial<IAgent>): Promise<IAgent>;
  update(id: string, partial: Partial<IAgent>): Promise<IAgent | null>;
  /** Returns flat list of all agents in company for tree building */
  findOrgTree(companyId: string): Promise<IAgent[]>;
}

export const AGENT_REPOSITORY = Symbol('IAgentRepository');
