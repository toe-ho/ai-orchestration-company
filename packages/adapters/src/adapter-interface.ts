import type { IExecutionEvent, IExecutionRequest, IExecutionResult } from '@aicompany/shared';

/**
 * IAdapter — contract every adapter must implement.
 * execute() returns an AsyncIterable of execution events (SSE-style).
 */
export interface IAdapter {
  /** Execute an agent run; yields events as the run progresses */
  execute(request: IExecutionRequest): AsyncIterable<IExecutionEvent>;

  /** Cancel a running agent run by runId */
  cancel(runId: string): Promise<void>;

  /** Health check — returns true if the adapter is reachable */
  health(): Promise<boolean>;
}
