import { promises as fs } from 'fs';
import type { IExecutionEvent, IExecutionRequest } from '@aicompany/shared';
import type { IAdapter } from '../adapter-interface.js';
import { cleanEnv } from '@aicompany/adapter-utils';
import { spawnStreaming } from '@aicompany/adapter-utils';
import { parseClaudeOutputLine } from './claude-output-parser.js';
import { ClaudeSessionManager } from './claude-session-manager.js';

const sessionManager = new ClaudeSessionManager();

/** Map of runId → cancel function for in-flight executions */
const activeCancels = new Map<string, () => void>();

/**
 * ClaudeAdapter — spawns the `claude` CLI, streams JSON output line-by-line,
 * and yields IExecutionEvent objects.
 */
export class ClaudeAdapter implements IAdapter {
  async *execute(request: IExecutionRequest): AsyncIterable<IExecutionEvent> {
    const { runId, agentId, envVars, timeoutSec, contextJson } = request;

    // Determine taskId from contextJson or fallback
    const taskId = (contextJson['taskId'] as string | undefined) ?? 'default';

    // Write prompt to temp file
    const promptPath = `/tmp/prompt-${runId}.md`;
    const prompt = (contextJson['prompt'] as string | undefined) ?? JSON.stringify(contextJson);
    await fs.writeFile(promptPath, prompt, 'utf-8');

    // Build CLI args
    const args = ['--output-format', 'stream-json', '--print', '--file', promptPath];

    // Check for existing session to resume
    const existingSession = await sessionManager.loadSession(agentId, taskId);
    if (existingSession) {
      args.push('--resume', existingSession);
    }

    // Build clean env — allowlist only
    const cleanedEnv = cleanEnv({ ...process.env as Record<string, string>, ...envVars });

    let seq = 0;
    let sessionId: string | null = null;

    const { lines, cancel, done } = spawnStreaming({
      command: 'claude',
      args,
      env: cleanedEnv,
      onStderr: (line) => {
        // stderr logged but not yielded — could add a stderr event type if needed
        console.error(`[claude stderr] ${line}`);
      },
    });

    activeCancels.set(runId, cancel);

    // Timeout guard
    const timeoutHandle = setTimeout(() => cancel(), timeoutSec * 1000);

    try {
      for await (const line of lines) {
        const event = parseClaudeOutputLine(line, runId, seq++);
        if (!event) continue;

        // Capture session_id from system or result events
        if (event.eventType === 'system' || event.eventType === 'result') {
          const sid = (event.payload as Record<string, unknown>)?.['session_id'] as string | undefined;
          if (sid) sessionId = sid;
        }

        yield event;
      }

      const { exitCode, timedOut } = await done;

      // Persist session for next run
      if (sessionId) {
        await sessionManager.saveSession(agentId, taskId, sessionId).catch(() => {});
      }

      // Emit final result event if not already emitted
      const finalEvent: IExecutionEvent = {
        runId,
        seq: seq++,
        eventType: timedOut ? 'timed_out' : exitCode === 0 ? 'done' : 'error',
        stream: 'system',
        message: timedOut ? 'Execution timed out' : `Exit code ${exitCode}`,
        payload: { exitCode, timedOut },
        timestamp: new Date(),
      };
      yield finalEvent;
    } finally {
      clearTimeout(timeoutHandle);
      activeCancels.delete(runId);
      await fs.unlink(promptPath).catch(() => {});
    }
  }

  async cancel(runId: string): Promise<void> {
    const cancelFn = activeCancels.get(runId);
    if (cancelFn) {
      cancelFn();
      activeCancels.delete(runId);
    }
  }

  async health(): Promise<boolean> {
    try {
      const { spawnWithTimeout } = await import('@aicompany/adapter-utils');
      const result = await spawnWithTimeout({
        command: 'claude',
        args: ['--version'],
        env: {},
        cwd: '/tmp',
        timeoutMs: 5000,
      });
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }
}
