export interface IExecutionResult {
  runId: string;
  exitCode: number;
  status: 'succeeded' | 'failed' | 'cancelled' | 'timed_out';
  inputTokens: number;
  outputTokens: number;
  costCents: number;
  durationMs: number;
  model: string | null;
  stdoutExcerpt: string | null;
}
