export interface IHeartbeatRunEvent {
  id: number;
  runId: string;
  seq: number;
  eventType: string;
  stream: string | null;
  message: string | null;
  payload: Record<string, unknown> | null;
}
