import type { IHeartbeatRunEvent } from '@aicompany/shared';

export interface IHeartbeatRunEventRepository {
  insertEvent(data: Omit<IHeartbeatRunEvent, 'id'>): Promise<IHeartbeatRunEvent>;
  listByRun(runId: string): Promise<IHeartbeatRunEvent[]>;
  /** Returns the most recent event timestamp for a run (used by orphan reaper) */
  getLastEventTime(runId: string): Promise<Date | null>;
}

export const HEARTBEAT_RUN_EVENT_REPOSITORY = Symbol('IHeartbeatRunEventRepository');
