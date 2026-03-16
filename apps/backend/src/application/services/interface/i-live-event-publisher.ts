import type { IExecutionEvent } from '@aicompany/shared';

/** Publishes live execution events to Redis for real-time streaming (Phase 7) */
export interface ILiveEventPublisher {
  publish(companyId: string, runId: string, event: IExecutionEvent): Promise<void>;
}

export const LIVE_EVENT_PUBLISHER = Symbol('ILiveEventPublisher');
