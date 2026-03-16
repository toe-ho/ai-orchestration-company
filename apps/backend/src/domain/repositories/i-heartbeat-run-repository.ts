import type { IHeartbeatRun } from '@aicompany/shared';

export interface IHeartbeatRunRepository {
  findById(id: string): Promise<IHeartbeatRun | null>;
  findByIdAndCompany(id: string, companyId: string): Promise<IHeartbeatRun | null>;
  findActiveByAgent(agentId: string): Promise<IHeartbeatRun[]>;
  /** Runs stuck in 'running' status older than the given cutoff date */
  findOrphanedRuns(cutoff: Date): Promise<IHeartbeatRun[]>;
  create(data: Partial<IHeartbeatRun>): Promise<IHeartbeatRun>;
  update(id: string, partial: Partial<IHeartbeatRun>): Promise<IHeartbeatRun | null>;
  listByCompany(companyId: string, limit?: number): Promise<IHeartbeatRun[]>;
  listByAgent(companyId: string, agentId: string, limit?: number): Promise<IHeartbeatRun[]>;
}

export const HEARTBEAT_RUN_REPOSITORY = Symbol('IHeartbeatRunRepository');
