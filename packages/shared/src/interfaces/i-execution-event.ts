export interface IExecutionEvent {
  runId: string;
  seq: number;
  eventType: string;
  stream: 'system' | 'stdout' | 'stderr' | null;
  message: string | null;
  payload: Record<string, unknown> | null;
  timestamp: Date;
}
