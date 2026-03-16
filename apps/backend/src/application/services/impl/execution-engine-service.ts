import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IExecutionEvent, IExecutionRequest } from '@aicompany/shared';
import type { IExecutionRunner } from '../interface/i-execution-runner.js';
import type { AppConfig } from '../../../config/app-config.js';

/** Parses SSE chunks from an HTTP response into IExecutionEvent objects */
function* parseSseChunk(chunk: string, runId: string, seq: { value: number }): Iterable<IExecutionEvent> {
  const messages = chunk.split('\n\n');
  for (const msg of messages) {
    if (!msg.trim()) continue;
    const lines = msg.split('\n');
    let eventType = 'message';
    let dataStr = '';
    for (const line of lines) {
      if (line.startsWith('event:')) eventType = line.slice(6).trim();
      else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
    }
    if (!dataStr) continue;
    try {
      const payload = JSON.parse(dataStr) as Record<string, unknown>;
      yield {
        runId,
        seq: seq.value++,
        eventType,
        stream: (payload['stream'] as 'system' | 'stdout' | 'stderr') ?? null,
        message: (payload['message'] as string) ?? null,
        payload,
        timestamp: new Date(),
      };
    } catch {
      // skip malformed SSE data lines
    }
  }
}

/** HTTP POST to executor VM + SSE stream parser — selects runner based on NODE_ENV */
@Injectable()
export class ExecutionEngineService implements IExecutionRunner {
  private readonly logger = new Logger(ExecutionEngineService.name);
  private readonly executorUrl: string;

  constructor(config: ConfigService) {
    const app = config.get<AppConfig>('app')!;
    this.executorUrl =
      app.nodeEnv === 'development'
        ? app.localExecutorUrl
        : '';
  }

  async *execute(request: IExecutionRequest): AsyncIterable<IExecutionEvent> {
    const url = this.executorUrl || `http://${request.controlPlaneUrl}:3200`;
    this.logger.debug(`POST ${url}/execute run=${request.runId}`);
    const res = await fetch(`${url}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(request.timeoutSec * 1000),
    });
    if (!res.ok || !res.body) {
      throw new Error(`Executor returned ${res.status}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    const seq = { value: 0 };
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // Process complete SSE messages (delimited by \n\n)
      const boundary = buffer.lastIndexOf('\n\n');
      if (boundary !== -1) {
        const complete = buffer.slice(0, boundary + 2);
        buffer = buffer.slice(boundary + 2);
        yield* parseSseChunk(complete, request.runId, seq);
      }
    }
    if (buffer.trim()) {
      yield* parseSseChunk(buffer, request.runId, seq);
    }
  }

  async cancel(executorUrl: string, runId: string): Promise<void> {
    const url = this.executorUrl || executorUrl;
    await fetch(`${url}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runId }),
    });
  }
}
