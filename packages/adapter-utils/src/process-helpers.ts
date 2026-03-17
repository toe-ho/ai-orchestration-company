import { spawn, type ChildProcess } from 'child_process';
import { createInterface } from 'readline';

export interface SpawnOptions {
  command: string;
  args: string[];
  env: Record<string, string>;
  cwd: string;
  timeoutMs: number;
}

export interface SpawnResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export interface StreamSpawnOptions {
  command: string;
  args: string[];
  env: Record<string, string>;
  cwd?: string;
  onStderr?: (line: string) => void;
}

export interface StreamSpawnResult {
  lines: AsyncIterable<string>;
  cancel: () => void;
  done: Promise<{ exitCode: number; timedOut: boolean }>;
}

/**
 * Spawn a child process with timeout support.
 * Collects stdout/stderr and resolves when the process exits or times out.
 */
export function spawnWithTimeout(opts: SpawnOptions): Promise<SpawnResult> {
  return new Promise((resolve) => {
    let timedOut = false;
    let stdoutBuf = '';
    let stderrBuf = '';

    const child: ChildProcess = spawn(opts.command, opts.args, {
      cwd: opts.cwd,
      env: opts.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout?.on('data', (d: Buffer) => { stdoutBuf += d.toString(); });
    child.stderr?.on('data', (d: Buffer) => { stderrBuf += d.toString(); });

    const timer = setTimeout(() => {
      timedOut = true;
      killTree(child.pid);
    }, opts.timeoutMs);

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        exitCode: code ?? 1,
        stdout: stdoutBuf,
        stderr: stderrBuf,
        timedOut,
      });
    });
  });
}

/**
 * Spawn a child process and yield stdout lines as an AsyncIterable.
 * Returns cancel() to SIGTERM the process and done promise for exit info.
 */
export function spawnStreaming(opts: StreamSpawnOptions): StreamSpawnResult {
  const child: ChildProcess = spawn(opts.command, opts.args, {
    cwd: opts.cwd ?? process.cwd(),
    env: opts.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  // Wire up stderr line handler
  if (opts.onStderr && child.stderr) {
    const rlErr = createInterface({ input: child.stderr, crlfDelay: Infinity });
    rlErr.on('line', opts.onStderr);
  }

  let timedOut = false;
  let clearKillTimer: (() => void) | null = null;

  const cancel = (): void => {
    timedOut = true;
    clearKillTimer = killTree(child.pid);
  };

  const done = new Promise<{ exitCode: number; timedOut: boolean }>((resolve) => {
    child.on('close', (code) => {
      if (clearKillTimer) clearKillTimer();
      resolve({ exitCode: code ?? 1, timedOut });
    });
    child.on('error', () => {
      if (clearKillTimer) clearKillTimer();
      resolve({ exitCode: 1, timedOut });
    });
  });

  // Build AsyncIterable from readline on stdout
  async function* readLines(): AsyncIterable<string> {
    if (!child.stdout) return;

    const rl = createInterface({ input: child.stdout, crlfDelay: Infinity });

    // Wrap readline 'line' events as an async iterable
    const lineQueue: string[] = [];
    let resolve: (() => void) | null = null;
    let closed = false;

    rl.on('line', (line) => {
      lineQueue.push(line);
      if (resolve) {
        const r = resolve;
        resolve = null;
        r();
      }
    });

    rl.on('close', () => {
      closed = true;
      if (resolve) {
        const r = resolve;
        resolve = null;
        r();
      }
    });

    while (true) {
      if (lineQueue.length > 0) {
        yield lineQueue.shift()!;
      } else if (closed) {
        break;
      } else {
        await new Promise<void>((res) => { resolve = res; });
      }
    }
  }

  return { lines: readLines(), cancel, done };
}

/** Kill a process and all its children. Returns a cleanup function to clear the escalation timer. */
export function killTree(pid: number | undefined): () => void {
  if (!pid) return () => {};
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    process.kill(-pid, 'SIGTERM');
    // Escalate to SIGKILL after 5s if still running
    timer = setTimeout(() => {
      try { process.kill(-pid, 'SIGKILL'); } catch { /* already dead */ }
    }, 5000);
  } catch {
    try { process.kill(pid, 'SIGTERM'); } catch { /* already dead */ }
  }
  return () => { if (timer) clearTimeout(timer); };
}
