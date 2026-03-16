import { spawn, type ChildProcess } from 'child_process';

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
      env: { ...process.env, ...opts.env },
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

/** Kill a process and all its children */
function killTree(pid: number | undefined): void {
  if (!pid) return;
  try {
    process.kill(-pid, 'SIGKILL');
  } catch {
    try { process.kill(pid, 'SIGKILL'); } catch { /* already dead */ }
  }
}
