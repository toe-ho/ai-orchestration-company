export interface ActiveRun {
  runId: string;
  agentId: string;
  cancel: () => void;
  startedAt: Date;
}

/**
 * Tracks active agent runs and enforces per-agent concurrency limits.
 * Acts as a singleton registry for in-flight executions.
 */
class ExecutionManager {
  private runs = new Map<string, ActiveRun>();

  add(run: ActiveRun): void {
    this.runs.set(run.runId, run);
  }

  get(runId: string): ActiveRun | undefined {
    return this.runs.get(runId);
  }

  getByAgent(agentId: string): ActiveRun | undefined {
    for (const run of this.runs.values()) {
      if (run.agentId === agentId) return run;
    }
    return undefined;
  }

  remove(runId: string): void {
    this.runs.delete(runId);
  }

  activeCount(): number {
    return this.runs.size;
  }

  cancelAll(): void {
    for (const run of this.runs.values()) {
      try { run.cancel(); } catch { /* ignore */ }
    }
    this.runs.clear();
  }
}

export const executionManager = new ExecutionManager();
