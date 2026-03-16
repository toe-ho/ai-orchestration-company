import type { IExecutionEvent, IExecutionRequest } from '@aicompany/shared';

/** Abstraction over execution backends: CloudRunner (Fly.io) and LocalRunner (dev) */
export interface IExecutionRunner {
  /** Stream execution events from the executor VM via SSE */
  execute(request: IExecutionRequest): AsyncIterable<IExecutionEvent>;
  /** Signal the executor to cancel the current run */
  cancel(executorUrl: string, runId: string): Promise<void>;
}

export const EXECUTION_RUNNER = Symbol('IExecutionRunner');
